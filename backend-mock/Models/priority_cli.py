import argparse
import joblib
import pandas as pd

def main():
    # Set up argument parser for the command line
    parser = argparse.ArgumentParser(description="Run priority score predictions from a CSV file.")
    parser.add_argument(
        "--input", "-i", 
        required=True, 
        help="Path to the input CSV file containing the request data."
    )
    parser.add_argument(
        "--output", "-o", 
        default="priority_predictions_output.csv", 
        help="Path to save the resulting CSV file with predictions."
    )
    
    args = parser.parse_args()

    # Load trained model
    print("Loading model...")
    model = joblib.load('priority_score_predictor.pkl')

    # Load input data into a DataFrame
    print(f"Reading data from {args.input}...")
    datas = pd.read_csv(args.input)

    # Drop columns not used for training/prediction
    dropped_columns = [
        'request_id', 'source_system', 'department', 
        'region', 'corridor_id', 'asset_id', 'detected_date'
    ]
    
    # Only drop columns that actually exist in the dataframe to prevent errors
    existing_dropped_columns = [col for col in dropped_columns if col in datas.columns]
    datas1 = datas.drop(columns=existing_dropped_columns)

    # Generate predictions
    print("Calculating priority scores...")
    priority_score = model.predict(datas1)
    
    # Append the results back to the original dataframe
    datas['priority_score'] = priority_score

    # Save to the output file
    datas.to_csv(args.output, index=False)
    print(f"Success! Predictions saved to {args.output}")

if __name__ == "__main__":
    main()