import librosa
from ultralytics import YOLO
import cv2
import os

class SensoryPerceptionEngine:
    def __init__(self, **kwargs):
        model_path = "municipal_transit_v1.pt"
        if os.path.exists(model_path):
            self.transit_model = YOLO(model_path)
        else:
            print(f"⚠️ Warning: '{model_path}' not found. Falling back to 'yolov8n.pt'.")
            self.transit_model = YOLO("yolov8n.pt")

    def analyze_acoustic_density(self, audio_path: str) -> float:
        """Pillar 19: Extracts dB intensity from scraped local social video audio."""
        y, sr = librosa.load(audio_path, sr=None)
        rms = librosa.feature.rms(y=y)
        # Convert RMS amplitude to estimated decibel (dB) baseline
        db_levels = librosa.amplitude_to_db(rms, ref=1.0)
        median_db = float(db_levels.mean())
        # > 75 dB indicates severe indoor haggling/friction
        return min(100.0, max(40.0, median_db + 45.0))

    def parse_intersection_cctv(self, stream_url: str) -> dict:
        """Pillar 8: Counts offline transit influx via public traffic cams."""
        cap = cv2.VideoCapture(stream_url)
        transit_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            results = self.transit_model(frame)
            for box in results[0].boxes:
                if int(box.cls[0]) in [2, 5, 7]:  # Truck, Bus, Minibus classes
                    transit_count += 1
            break # Single frame sample for speed
            
        cap.release()
        return {"transit_influx": transit_count, "offline_multiplier": 1.0 + (transit_count / 100.0)}