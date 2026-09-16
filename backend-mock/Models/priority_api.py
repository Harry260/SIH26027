import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
from pydantic import BaseModel

# Create DataFrame matching the model's feature column names
app=FastAPI()

# Load trained model
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Allows all headers (e.g., Content-Type)
)
model = joblib.load('priority_score_predictor.pkl')

class Data(BaseModel):
    request_id:list
    source_system:list
    department:list
    region:list
    corridor_id:list
    asset_id:list
    defect_type:list
    severity:list
    overdue_days:list
    estimated_duration_hours:list
    detected_date:list

@app.post("/api/priority")
def get(data:Data):

    datas=pd.DataFrame(data.model_dump())
    Dropped_columns=['request_id','source_system','department','region','corridor_id','asset_id','detected_date']
    datas1=datas.drop(columns=Dropped_columns)
    priority_score=model.predict(datas1)
    datas['priority_score']=priority_score
    return datas.to_dict(orient="list")




