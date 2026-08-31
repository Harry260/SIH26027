import joblib
import pandas as pd
from sklearn.model_selection import cross_validate
dataframe=pd.read_csv('combined_maintenance_requests.csv') #Loads the csv file
Dropped_columns=['priority_score','request_id','source_system','department','region','corridor_id','asset_id','detected_date'] #List containing the target column and other columns(unnecessary ones) which are gonna be dropped ie deleted from the dataframe 
target=dataframe['priority_score'] #Target column
total_data=dataframe.drop(columns=Dropped_columns) 
model=joblib.load('priority_score_predictor.pkl')
cv=cross_validate(model,total_data,target)
scores=cv['test_score']
print("Accuracy: ",scores.mean(),'+-',scores.std())
print("Reference: ",cv)
