from fastapi import APIRouter, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.status import HTTP_302_FOUND
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from models import User
from database import SessionLocal

templates = Jinja2Templates(directory="templates")
router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SESSIONS = {}

def get_current_user(request: Request):
    session_id = request.cookies.get("session_id")
    if session_id in SESSIONS:
        return SESSIONS[session_id]
    return None

@router.get("/login", response_class=HTMLResponse, name="login")
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/login", name="login_post")
def login_post(request: Request,
               email: str = Form(...),
               password: str = Form(...),
               db: Session = Depends(get_db)):

    if not password:
        return RedirectResponse("/login", status_code=HTTP_302_FOUND)

    user = db.query(User).filter(User.email == email).first()
    if not user or not pwd_context.verify(password[:72], user.password):
        return RedirectResponse("/login", status_code=HTTP_302_FOUND)

    session_id = str(user.id)
    SESSIONS[session_id] = user
    response = RedirectResponse("/profile", status_code=HTTP_302_FOUND)
    response.set_cookie(key="session_id", value=session_id)
    return response

@router.get("/signup", response_class=HTMLResponse, name="signup")
def signup_page(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})

@router.post("/signup", name="signup_post")
def signup_post(request: Request,
                email: str = Form(...),
                name: str = Form(...),
                password: str = Form(...),
                db: Session = Depends(get_db)):

    if not password:
        return RedirectResponse("/signup", status_code=HTTP_302_FOUND)

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        return RedirectResponse("/signup", status_code=HTTP_302_FOUND)

    password = str(password)  # гарантируем строку
    hashed_password = pwd_context.hash(password[:72])  # bcrypt limitation
    new_user = User(email=email, name=name, password=hashed_password)
    db.add(new_user)
    db.commit()
    return RedirectResponse("/login", status_code=HTTP_302_FOUND)

@router.get("/logout", name="logout")
def logout(request: Request):
    session_id = request.cookies.get("session_id")
    if session_id in SESSIONS:
        del SESSIONS[session_id]
    response = RedirectResponse("/", status_code=HTTP_302_FOUND)
    response.delete_cookie("session_id")
    return response
