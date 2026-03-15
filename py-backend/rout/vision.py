from fastapi import APIRouter, File, UploadFile
from retinaface import RetinaFace
import cv2
import numpy as np

router = APIRouter()

@router.post("/score")  # POST is correct for file uploads
async def get_quality_score(file: UploadFile = File(...)):
    try:
        
        contents = await file.read()
        
      
        nparr = np.frombuffer(contents, np.uint8)  # fix typo
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"score": 0, "message": "Invalid image format"}

       
        faces = RetinaFace.detect_faces(img)

       
        if not faces or not isinstance(faces, dict):
            return {"score": 0, "faces": 0, "message": "No face detected"}

        num_faces = len(faces)  # safe now

        first_face_key = list(faces.keys())[0]
        confidence = faces[first_face_key]['score']

   
        if num_faces > 1:
            return {"score": 0.2, "faces": num_faces, "message": "Multiple faces detected"}

       
        return {"score": round(float(confidence), 2), "faces": num_faces, "message": "Quality analysis complete"}

    except Exception as e:
        return {"score": 0, "error": str(e), "message": "Server error in Python"}
