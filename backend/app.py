from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore

# Flask App Setup
app = Flask(__name__)
CORS(app) # Frontend-லிருந்து வரும் Request-ஐ அனுமதிக்க

# Firebase Database Connection Setup
try:
    # நீங்கள் டவுன்லோட் செய்த JSON ஃபைல் பெயர்
    cred = credentials.Certificate("firebase_credentials.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("🔥 Firebase Connected Successfully!")
except Exception as e:
    print(f"❌ Firebase Connection Failed: {e}")

# ---------------------------------------------------------
# API Endpoint 1: ஓட்டு போடுவதற்கான ரூட் (POST Request)
# ---------------------------------------------------------
@app.route('/api/vote', methods=['POST'])
def cast_vote():
    try:
        data = request.json
        voter_id = data.get('voter_id')
        candidate_id = data.get('candidate_id')

        if not voter_id or not candidate_id:
            return jsonify({"status": "error", "message": "Voter ID and Candidate ID are required"}), 400

        # ஓட்டர் ஏற்கனவே ஓட்டு போட்டுட்டாரா என செக் செய்ய
        voter_ref = db.collection('voters').document(voter_id)
        voter_doc = voter_ref.get()

        if voter_doc.exists:
            return jsonify({"status": "error", "message": "நீங்கள் ஏற்கனவே வாக்களித்துவிட்டீர்கள்! (Already Voted)"}), 403

        # ஓட்டு போடவில்லை என்றால், ஓட்டை பதிவு செய்யவும்
        # 1. வேட்பாளருக்கு ஓட்டை கூட்டவும்
        candidate_ref = db.collection('candidates').document(candidate_id)
        candidate_ref.set({"votes": firestore.Increment(1)}, merge=True)

        # 2. ஓட்டரை 'Voted' என மார்க் செய்யவும்
        voter_ref.set({"voted": True, "voted_for": candidate_id})

        return jsonify({"status": "success", "message": "உங்கள் வாக்கு வெற்றிகரமாக பதிவானது!"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ---------------------------------------------------------
# API Endpoint 2: ரிசல்ட் பார்ப்பதற்கான ரூட் (GET Request)
# ---------------------------------------------------------
@app.route('/api/results', methods=['GET'])
def get_results():
    try:
        candidates_ref = db.collection('candidates').stream()
        results = {}
        
        for doc in candidates_ref:
            results[doc.id] = doc.to_dict().get('votes', 0)
            
        return jsonify({"status": "success", "data": results}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Server-ஐ ரன் செய்ய
if __name__ == '__main__':
    app.run(debug=True, port=5000)