from app.services.data_loader import get_companies_df, get_stats_data
from app.models.schemas import NationalStats, WilayaStats

def _safe_value_counts(df, col, head=None):
    """Safely get value_counts for a column, returning {} if column doesn't exist."""
    if col not in df.columns:
        return {}
    vc = df[col].dropna().value_counts()
    if head:
        vc = vc.head(head)
    return vc.to_dict()

def get_national_stats():
    stats = get_stats_data()
    df = get_companies_df()
    
    total = stats.get("total", 0)
    wilayas = stats.get("wilayas", {})
    types = stats.get("types", {})
    
    if not df.empty:
        top_groups = _safe_value_counts(df, 'activity_group')
        top_activities = _safe_value_counts(df, 'activity_normalized', head=10)
    else:
        top_groups = {}
        top_activities = {}

    return NationalStats(
        total=total,
        wilayas=wilayas,
        types=types,
        top_activities=top_activities,
        top_groups=top_groups
    )

def get_wilaya_stats(wilaya: str):
    df = get_companies_df()
    stats = get_stats_data()
    
    if df.empty:
        return None
        
    wilaya_df = df[df['wilaya'] == wilaya]
    count = len(wilaya_df)
    
    total = stats.get("total", 1)
    pct = round((count / total) * 100, 1)
    
    # Rank
    sorted_wilayas = sorted(stats.get("wilayas", {}).items(), key=lambda x: x[1], reverse=True)
    rank = next((i for i, (w, c) in enumerate(sorted_wilayas, 1) if w == wilaya), 0)
    
    if not wilaya_df.empty:
        top_groups = _safe_value_counts(wilaya_df, 'activity_group')
        top_activities = _safe_value_counts(wilaya_df, 'activity_normalized', head=10)
        types = _safe_value_counts(wilaya_df, 'type')
    else:
        top_groups = {}
        top_activities = {}
        types = {}

    return WilayaStats(
        wilaya=wilaya,
        count=count,
        pct_national=pct,
        rank=rank,
        types=types,
        top_groups=top_groups,
        top_activities=top_activities
    )

