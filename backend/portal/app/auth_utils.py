from .models import Profile


def get_profile_role(user):
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={"role": Profile.ROLE_CUSTOMER},
    )
    return profile.role


def is_superadmin(user):
    return get_profile_role(user) == Profile.ROLE_SUPERADMIN


def is_admin(user):
    return get_profile_role(user) == Profile.ROLE_ADMIN


def can_manage_users(user):
    return is_superadmin(user) or is_admin(user)


def user_payload(user):
    profile, _ = Profile.objects.get_or_create(
        user=user,
        defaults={"role": Profile.ROLE_CUSTOMER},
    )
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email or "",
        "first_name": user.first_name or "",
        "last_name": user.last_name or "",
        "role": profile.role,
        "phone": profile.phone or "",
        "email_verified": profile.email_verified,
        "google_linked": bool(profile.google_sub),
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    }
