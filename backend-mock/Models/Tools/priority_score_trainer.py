import pandas as pd 
import joblib
from sklearn.model_selection import train_test_split,cross_validate
from sklearn.preprocessing import OrdinalEncoder
from sklearn.compose import make_column_transformer
from sklearn.pipeline import make_pipeline
from sklearn.ensemble import HistGradientBoostingRegressor


dataframe=pd.read_csv('combined_maintenance_requests.csv') #Reading the dataset from the csv 
Dropped_columns=['priority_score','request_id','source_system','department','region','corridor_id','asset_id','detected_date'] #List containing the target column and other columns(unnecessary ones) which are gonna be dropped ie deleted from the dataframe 
target=dataframe['priority_score'] #Defining the target columns
total_data=dataframe.drop(columns=Dropped_columns) #Dropping columns
data_train,data_test,target_train,target_test=train_test_split(total_data,target,random_state=42,test_size=0.2,stratify=total_data['severity']) #Splitting total_data into train (80%) and test data (20%) , stratify helps to split original classes based on distribution
cate_columns=total_data.select_dtypes(include='object').columns.tolist() #Columns containing strings, only
Preprocess=OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1) #This is used to process columns containing strings by converting them to numbers honestly its like assigning 0:High , 1:low etc to make it easier for ai to train on , handle_unknown is used so as to handle rare unknown categories during prediction time 
preprocessor=make_column_transformer((Preprocess,cate_columns),remainder='passthrough') #Only processing  the category_columns 
pre_model=HistGradientBoostingRegressor() #The model used here
model=make_pipeline(preprocessor,pre_model) #make_pipeline helps a lot , by skipping  calling functions like transform etc as its done by it and by not seperately executing the encoder and model
model.fit(data_train,target_train)
'''
cv=cross_validate(model,data_test,target_test) #cross_Validate means lets divide the data_Test into 5 sets (cv=5 as default) and one set is hidden while the model is taught on the rest, lets say fold 1 is hidden and its taught on fold 2,3,4,5  and then tested on the hidden set .The process repeats like now fold 2 is hidden etc
score=cv['test_score']
target_data=model.predict(data_test) #Predicting the data
print("Cross validated accuracy: ",score.mean(),'+-',score.std()) #cross validating gives the variance-metric related accuracy in regression models , which proves its reliability which is around 92%
print("-"*65)
'''

joblib.dump(model,"priority_score_predictor.pkl") #Exporting the model


