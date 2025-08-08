import logging

from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)


class TokenAuthenticationPhaseout(TokenAuthentication):
    """TokenAuthentication with features to help phase out legacy token auth

    Logs usage and triggers a 401 if legacy token auth is not enabled for the organization."""

    def authenticate(self, request):
        """Authenticate the request and log if successful."""
        from core.feature_flags import flag_set

        auth_result = super().authenticate(request)
        JWT_ACCESS_TOKEN_ENABLED = flag_set('fflag__feature_develop__prompts__dia_1829_jwt_token_auth')
        if JWT_ACCESS_TOKEN_ENABLED and (auth_result is not None):
            user, _ = auth_result
            org = user.active_organization
            org_id = org.id if org else None

            # raise 401 if legacy API token auth disabled (i.e. this token is no longer valid)
            if org and (not org.jwt.legacy_api_tokens_enabled):
                raise AuthenticationFailed(
                    'Authentication token no longer valid: legacy token authentication has been disabled for this organization'
                )

            logger.info(
                'Legacy token authentication used',
                extra={'user_id': user.id, 'organization_id': org_id, 'endpoint': request.path},
            )
        return auth_result
