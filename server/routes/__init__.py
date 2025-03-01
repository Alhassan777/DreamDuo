from flask import Blueprint

# Define blueprints first
auth_bp = Blueprint('auth', __name__)
tasks_bp = Blueprint('tasks', __name__)
user_bp = Blueprint('user', __name__)
tags_bp = Blueprint('tags', __name__)

# Import views after blueprint definitions to avoid circular imports
from .auth import *
from .tasks import *
from .user import *
from .tags import *