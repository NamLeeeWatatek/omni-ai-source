"""
Utility functions
"""

def get_user_id_as_int(user_id: str | int) -> int:
    """
    Convert user_id to integer
    Handles both string and int types from get_current_user
    """
    if isinstance(user_id, str):
        return int(user_id)
    return user_id

def get_user_id_as_str(user_id: str | int) -> str:
    """
    Convert user_id to string
    Handles both string and int types from get_current_user
    """
    if isinstance(user_id, int):
        return str(user_id)
    return user_id

# Aliases for convenience
to_int = get_user_id_as_int
to_str = get_user_id_as_str
