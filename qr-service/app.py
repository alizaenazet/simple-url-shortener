from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import qrcode
import io
import base64

app = FastAPI()

class QRRequest(BaseModel):
    data: str

@app.get("/")
def read_root():
    return {"name": "qr-service", "status": "online"}

@app.post("/qr")
def generate_qr(req: QRRequest):
    try:
        qr = qrcode.QRCode(box_size=10, border=4)
        qr.add_data(req.data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "status": "success",
            "message": "QR code generated.",
            "data": {"qrBase64": img_b64},
            "errors": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail={
            "status": "error",
            "message": "Failed to generate QR code.",
            "data": None,
            "errors": [{"code": "QR_GENERATION_FAILED", "message": str(e)}]
        })

