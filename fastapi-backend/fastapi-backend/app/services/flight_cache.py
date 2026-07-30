"""
Flight Search Cache Service
Handles caching of flight search results in Supabase
"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import os

logger = logging.getLogger(__name__)

async def get_cached_results(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: Optional[str]
) -> Optional[Dict[str, Any]]:
    """
    Retrieve cached flight results if available and not expired
    
    Args:
        origin: IATA airport code
        destination: IATA airport code
        departure_date: YYYY-MM-DD
        return_date: Optional return date
    
    Returns:
        Cached results dict or None if not found/expired
    """
    try:
        from app.services.supabase_client import get_supabase
        
        supabase = get_supabase()
        cache_key = _build_cache_key(origin, destination, departure_date, return_date)
        
        # Query cache table
        result = supabase.table('flight_search_cache').select('*').eq(
            'cache_key', cache_key
        ).gte(
            'expires_at', datetime.utcnow().isoformat()
        ).order('created_at', desc=True).limit(1).execute()
        
        if result.data and len(result.data) > 0:
            cached = result.data[0]
            logger.info(f"Cache hit for {cache_key}")
            
            # Return cached response with metadata
            cached_response = cached['response_data']
            cached_response['cached'] = True
            cached_response['cached_at'] = cached['created_at']
            cached_response['expires_at'] = cached['expires_at']
            
            return cached_response
        
        logger.info(f"Cache miss for {cache_key}")
        return None
    
    except Exception as e:
        logger.warning(f"Cache retrieval error: {str(e)}")
        return None


async def cache_results(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: Optional[str],
    results: Dict[str, Any]
):
    """
    Store flight search results in cache
    
    Args:
        origin: IATA airport code
        destination: IATA airport code
        departure_date: YYYY-MM-DD
        return_date: Optional return date
        results: Flight search results to cache
    """
    try:
        from app.services.supabase_client import get_supabase
        
        supabase = get_supabase()
        cache_key = _build_cache_key(origin, destination, departure_date, return_date)
        
        # Calculate expiry
        cache_ttl_hours = int(os.getenv('FLIGHT_CACHE_TTL_HOURS', '12'))
        expires_at = datetime.utcnow() + timedelta(hours=cache_ttl_hours)
        
        # Prepare cache entry
        cache_entry = {
            'cache_key': cache_key,
            'origin': origin,
            'destination': destination,
            'departure_date': departure_date,
            'return_date': return_date,
            'response_data': results,
            'expires_at': expires_at.isoformat()
        }
        
        # Upsert (insert or update)
        supabase.table('flight_search_cache').upsert(cache_entry).execute()
        
        logger.info(f"Cached results for {cache_key} until {expires_at}")
    
    except Exception as e:
        logger.warning(f"Cache storage error: {str(e)}")


def _build_cache_key(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: Optional[str]
) -> str:
    """Build unique cache key"""
    return f"{origin}-{destination}-{departure_date}-{return_date or 'oneway'}"


async def clear_expired_cache():
    """
    Clear expired cache entries
    Should be called periodically via cron job or startup task
    """
    try:
        from app.services.supabase_client import get_supabase
        
        supabase = get_supabase()
        
        # Delete expired entries
        result = supabase.table('flight_search_cache').delete().lt(
            'expires_at', datetime.utcnow().isoformat()
        ).execute()
        
        deleted_count = len(result.data) if result.data else 0
        logger.info(f"Cleared {deleted_count} expired cache entries")
        
        return {"deleted": deleted_count}
    
    except Exception as e:
        logger.error(f"Error clearing expired cache: {str(e)}")
        return {"error": str(e)}
