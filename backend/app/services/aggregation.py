from app.services.data_loader import get_companies_df, get_stats_data
from app.models.schemas import NationalStats, WilayaStats

def get_national_stats():
    stats = get_stats_data()
    df = get_companies_df()
    
    # Recalculate if needed or use pre-calculated stats.json
    # For now, mixing mainly stats.json with some dataframe aggregations if needed
    
    total = stats.get("total", 0)
    wilayas = stats.get("wilayas", {})
    types = stats.get("types", {})
    
    # Compute top groups from DF as they might not be in stats.json
    if not df.empty:
        top_groups = df['activity_group'].value_counts().to_dict()
        top_activities = df['activity_normalized'].value_counts().head(10).to_dict()
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
    
    # Activity breakdown for this Wilaya
    # Activity breakdown for this Wilaya
    if not wilaya_df.empty:
        top_groups = wilaya_df['activity_group'].value_counts().to_dict()
        top_activities = wilaya_df['activity_normalized'].value_counts().head(10).to_dict()
        # Calculate types
        types = wilaya_df['type'].value_counts().to_dict()
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
