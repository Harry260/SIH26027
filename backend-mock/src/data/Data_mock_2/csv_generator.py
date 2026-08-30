import pandas as pd 
import numpy as np 
np.random.seed(42) 
v2 = pd.read_csv('indian_railway_failure_detection_maintenance_v2.csv')
region_profile = v2.groupby('region').agg(
    avg_risk_score=('risk_score', 'mean'),
    avg_rail_wear=('rail_wear_mm', 'mean'),
    maint_rate=('maintenance_required', 'mean')
).reset_index()
region_profile['risk_weight'] = ((region_profile['maint_rate'] - region_profile['maint_rate'].min())
    / (region_profile['maint_rate'].max() - region_profile['maint_rate'].min() + 1e-9) #Nan edge case present it wouldn't error instead would return nan after all the operations
)
region_profile['risk_weight'] = region_profile['risk_weight'].fillna(0.5) * 0.6 + 0.4 #Turns nan case to 0.5 also the value range would be (0.4-1) even if risk_weight is 0
CORRIDORS = [f"CORR-{i:03d}" for i in range(1, 41)]
region_profile=region_profile.set_index('region')#Setting the region column as its index
regions = region_profile.index.tolist() #Regions list
corridor_region_map = {c: np.random.choice(regions) for c in CORRIDORS}
SEVERITY = ['Low', 'Medium', 'High', 'Critical']
SEVERITY_WEIGHTS_BASE = np.array([0.45, 0.30, 0.18, 0.07]) #Weights to make the distribution like Low 45% , Medium 30% , High 18% , Critical 7%
def severity_weights_for_region(region):
    w = region_profile.loc[region, 'risk_weight'] #Returning the specific row value for column risk_weight
    shift = SEVERITY_WEIGHTS_BASE.copy()
    move = 0.20 * w #0.2 is just for deciding how aggressive should the move factor be here its moderate
    #For each region its not equally distributed and doesn't have equal risk_weights hence doing the distribution system for each region with greater risk_weight mean greater chances of high risks
    shift[0] -= move * 0.6 
    shift[1] -= move * 0.4
    shift[2] += move * 0.7
    shift[3] += move * 0.3
    shift = np.clip(shift, 0.02, None)
    return shift / shift.sum() #just checking all will add up to one or not
def n_requests_for_region(region, base_n):
    w = region_profile.loc[region, 'risk_weight'] 
    return int(base_n * (0.7 + 0.6 * w)) #Depending on the amount of request needed, the integer with risk_weight with bit of modification is returned
def overdue_days_for_severity(sev, size):
    base = {'Low': (-20, 10), 'Medium': (-10, 20), 'High': (0, 35), 'Critical': (5, 60)} #Dictionary with severity as its key and a tuple which contains the lower and higher limit
    #Negative value means in the future its scheduled and positive means in the past it was scheduled
    lower_limit, higher_limit = base[sev]
    return np.random.randint(lower_limit, higher_limit, size=size)
def duration_hours_for_severity(sev, size):
    base = {'Low': (2, 6), 'Medium': (4, 10), 'High': (6, 16), 'Critical': (10, 30)} #Dictionary with severity as its key and a tuple which contains the lower and higher limit
    lo, hi = base[sev]
    return np.round(np.random.uniform(lo, hi, size=size), 1)
def generate_system_requests(system_name, department, defect_types, asset_prefix,
                              base_n_per_region, id_start):
    rows = []
    req_id = id_start
    max_possible = int(base_n_per_region * 1.3 * len(regions)) + 20 #Max_possible for assed_id
    unique_asset_numbers = np.random.choice(np.arange(1000, 9999), size=max_possible, replace=False)#Unique value for asset ids
    asset_pool_idx = 0
    for region in regions: #You can call a global variable but not update it without using 'global'
        n = n_requests_for_region(region, base_n_per_region) #Number returned after mixing base_n_for_region and risk_weight
        sev_w = severity_weights_for_region(region) #Gets the severity distribution one mixed with risk_weight
        region_corridors = [c for c, r in corridor_region_map.items() if r == region] #corridor_region_map is a dictionary containing the corridor as its key and region as its value so it checks if r=region and print the specific corridor list
        if not region_corridors:
            region_corridors = [np.random.choice(CORRIDORS)] #If region_corridors is empty , then random corridors list

        severities = np.random.choice(SEVERITY, size=n, p=sev_w) #gets the severity value depeding on its weights and size
        for sev in SEVERITY:
            mask = severities == sev #checks if sev value matches againset any single value in the array severities and returns a true/false array
            cnt = mask.sum() #checking the count
            if cnt == 0: #Skips if its not there
                continue
            overdue = overdue_days_for_severity(sev, cnt) #Overdue days
            duration = duration_hours_for_severity(sev, cnt) #Duration hours
            for i in range(cnt):
                rows.append({
                    'request_id': f"{system_name}-{req_id:05d}",  
                    'source_system': system_name, 
                    'department': department,
                    'region': region,
                    'corridor_id': np.random.choice(region_corridors), 
                    'asset_id': f"{asset_prefix}-{unique_asset_numbers[asset_pool_idx]}",#Unique asset ids
                    'defect_type': np.random.choice(defect_types), 
                    'severity': sev,
                    'overdue_days': int(overdue[i]), #Negative values mean in future while positive values mean in past
                    'estimated_duration_hours': float(duration[i]),
                    'detected_date': (pd.Timestamp('2026-08-01') -
                                      pd.Timedelta(days=int(np.random.randint(0, 90)))).date().isoformat()
                })
                req_id += 1
                asset_pool_idx += 1
    return pd.DataFrame(rows)


#Generates tms data
tms = generate_system_requests(                                                              
    system_name='TMS', department='Engineering',
    defect_types=['Rail Fracture', 'Ballast Degradation', 'Track Geometry Defect',
                  'Rail Corrugation', 'Fastening Failure', 'Weld Defect'],
    asset_prefix='TRACK', base_n_per_region=25, id_start=1
)

#Generates smms data
smms = generate_system_requests(
    system_name='SMMS', department='Signal & Telecommunication',
    defect_types=['Signal Relay Fault', 'Point Machine Failure', 'Track Circuit Fault',
                  'Interlocking Fault', 'Communication Link Failure', 'Level Crossing Fault'],
    asset_prefix='SIG', base_n_per_region=18, id_start=1
)
#Generates tdms data
tdms = generate_system_requests(
    system_name='TDMS', department='Traction Distribution',
    defect_types=['OHE Wire Wear', 'Insulator Damage', 'Feeder Fault',
                  'Traction Substation Fault', 'Circuit Breaker Fault', 'Earthing Fault'],
    asset_prefix='TRAC', base_n_per_region=15, id_start=1
)


combined = pd.concat([tms, smms, tdms], ignore_index=True)



# Save separate system files + combined file


sev_score_map = {'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4} # Dictionary containing number as key and severity  as value
severity_score = combined['severity'].map(sev_score_map) #replacing the severity with integer values for calculation
urgency_score = np.clip(combined['overdue_days'], 0, None) / 10.0 #urgency_score
sampled_risk = np.random.choice(v2['risk_score'].dropna(), size=len(combined), replace=True) #.dropna() is used to ignore empty nan values , here random risk_score is taken with certain duplicates maybe there
noise = (sampled_risk - sampled_risk.mean()) / sampled_risk.std() * 3 #noise
combined['priority_score'] = (severity_score * 10) + urgency_score + noise 
combined['priority_score'] = combined['priority_score'].round(2) #new column priority_score
tms.to_csv('tms_track_defects.csv', index=False)
smms.to_csv('smms_signal_defects.csv', index=False)
tdms.to_csv('tdms_traction_defects.csv', index=False)
combined.to_csv('combined_maintenance_requests.csv', index=False)
print(f"\nTMS requests: {len(tms)}")
print(f"SMMS requests: {len(smms)}")
print(f"TDMS requests: {len(tdms)}")
print(f"Combined total: {len(combined)}")
print(combined.head(10)[['request_id','department','region','severity','overdue_days','priority_score']]) #.head(10) means first 10 rows displayed

#Here initially risk_score ,rail_wear_mm and maintenance_required were used to create risk_weight through which severity was distributed depending on the region 
#The noise was added so as to create a realistic a bit hard predictable priority_score which is gonna be predicted by the AI model
