import os, json, re, uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dotenv import load_dotenv
load_dotenv()


# Config
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER')
DATA_FILE     = os.getenv('DATA_FILE')
SHEET_CONFIG  = os.getenv('SHEET_CONFIG')
CREDS_FILE    = os.getenv('CREDS_FILE')
SCOPES        = ['https://www.googleapis.com/auth/spreadsheets']

# Init
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('data', exist_ok=True)

# Google Sheets service
creds = service_account.Credentials.from_service_account_file(CREDS_FILE, scopes=SCOPES)
sheets_svc = build('sheets', 'v4', credentials=creds)

# Helpers
def load_json(path, default):
    if os.path.exists(path):
        return json.load(open(path))
    return default

def save_json(path, data):
    json.dump(data, open(path, 'w'), indent=2)

def load_customers():
    return load_json(DATA_FILE, [])

def save_customers(cust):
    save_json(DATA_FILE, cust)

def load_sheet_cfg():
    return load_json(SHEET_CONFIG, {})

def save_sheet_cfg(cfg):
    save_json(SHEET_CONFIG, cfg)

def allowed_file(fn):
    return '.' in fn and fn.rsplit('.',1)[1].lower() in {'xls','xlsx'}

# initialize sample
if not os.path.exists(DATA_FILE):
    sample = [{
        "id": str(uuid.uuid4()),
        "name": "Acme Corp",
        "email": "contact@acme.com",
        "phone": "123-456-7890",
        "country": "USA",
        "state": "California",
        "salesVolume": 120000,
        "mostPurchasedProduct": "Industrial Machinery",
        "lastUpdated": datetime.now().isoformat()
    }]
    save_customers(sample)

# Routes
@app.route('/api/customers', methods=['GET'])
def get_customers():
    return jsonify(load_customers())

@app.route('/api/customers', methods=['POST'])
def post_customers():
    if 'file' not in request.files:
        return jsonify(error="No file"), 400
    file = request.files['file']
    if not file or not allowed_file(file.filename):
        return jsonify(error="Invalid file"), 400

    fp = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(fp)

    df = pd.read_excel(fp)
    df.columns = [c.lower().replace(' ', '') for c in df.columns]
    mapping = {
        'customername':'name','emailaddress':'email',
        'phonenumber':'phone','region':'state','sales':'salesVolume','topproduct':'mostPurchasedProduct'
    }
    df.rename(columns=mapping, inplace=True)
    recs = df.to_dict(orient='records')

    existing = load_customers()
    added, updated = 0, 0

    for new in recs:
        new['salesVolume'] = float(new.get('salesVolume') or 0)
        new['lastUpdated'] = datetime.now().isoformat()
        dup = next((i for i,e in enumerate(existing)
                   if e.get('email')==new.get('email')), None)
        if dup is not None:
            new['id'] = existing[dup]['id']
            existing[dup].update(new)
            updated += 1
        else:
            new['id'] = str(uuid.uuid4())
            existing.append(new)
            added += 1

    save_customers(existing)
    return jsonify(message=f"Added {added}, Updated {updated}", added=added, updated=updated)

@app.route('/api/google-sheets/connect', methods=['POST'])
def connect_sheet():
    sheet_url = request.json.get('sheetUrl')
    match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', sheet_url or "")
    if not match:
        return jsonify(error="Invalid URL"), 400
    cfg = {"sheetId": match.group(1)}
    save_sheet_cfg(cfg)
    return jsonify(cfg)

@app.route('/api/google-sheets/sync', methods=['POST'])
def sync_sheet():
    cfg = load_sheet_cfg()
    sheet_id = cfg.get('sheetId')
    if not sheet_id:
        return jsonify(error="No sheet connected"), 400

    # Push local Sheet
    cust = load_customers()
    rows = [["Name","Email","Phone","Country","State","SalesVolume","TopProduct"]] + [
        [c.get(k,"") for k in ("name","email","phone","country","state","salesVolume","mostPurchasedProduct")]
        for c in cust
    ]
    sheets_svc.spreadsheets().values() \
      .update(spreadsheetId=sheet_id, range="Customers!A1",
              valueInputOption="RAW", body={"values": rows}) \
      .execute()

    # Pull Sheet local
    sheet = sheets_svc.spreadsheets().values() \
      .get(spreadsheetId=sheet_id, range="Customers!A1:G") \
      .execute().get("values", [])
    headers = sheet[0] if sheet else []
    new_list = []
    for row in sheet[1:]:
        obj = dict(zip(headers, row))
        # normalize as in upload endpoint...
        obj["salesVolume"] = float(obj.get("SalesVolume","0") or 0)
        obj["lastUpdated"] = datetime.now().isoformat()
        new_list.append({
          "id": obj.get("id", str(uuid.uuid4())),
          "name": obj.get("Name",""),
          "email": obj.get("Email",""),
          "phone": obj.get("Phone",""),
          "country": obj.get("Country",""),
          "state": obj.get("State",""),
          "salesVolume": obj["salesVolume"],
          "mostPurchasedProduct": obj.get("TopProduct",""),
          "lastUpdated": obj["lastUpdated"]
        })
    save_customers(new_list)

    return jsonify(message="Synced", updatedAt=datetime.now().isoformat())

if __name__ == '__main__':
    app.run(port=5000)
