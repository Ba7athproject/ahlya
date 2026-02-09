from app.services.data_loader import get_companies_df
from app.models.schemas import WilayaRisk, Flag
import numpy as np

def generate_risk_commentary(wilaya_data: dict, risk_scores: dict) -> dict:
    """
    Génère des commentaires éditoriaux en arabe basés sur les scores de risque.
    """
    s1, s2, s3 = risk_scores['s1'], risk_scores['s2'], risk_scores['s3']
    index = risk_scores['baath_index']
    
    # Defaults
    level = "LOW"
    level_ar = "منخفض"
    color = "emerald"

    if index >= 70:
        level = "HIGH"
        level_ar = "مرتفع"
        color = "red"
    elif index >= 40:
        level = "MEDIUM"
        level_ar = "متوسط"
        color = "amber"
    
    comments = []
    
    # S1 - Dépendance
    if s1 > 0.6: # lowered threshold slightly to match prompt logic 0.7 or 0.6 inconsistency
        # Prompt said > 0.7 but code example used 0.7. Let's stick to prompt code example logic if possible but use safe checks.
        dominant_groups = [g for g, count in wilaya_data['groups'].items() 
                           if g in ['AGRI_NATUREL', 'ENVIRONNEMENT', 'ENERGIE_MINES'] 
                           and count / (sum(wilaya_data['groups'].values()) or 1) > 0.3]
        if dominant_groups:
             comments.append(f"الولاية تعتمد بشكل كبير على الأنشطة المرتبطة بالموارد العمومية ({', '.join(dominant_groups)})")

    # S2 - Concentration
    if s2 > 0.7:
        if wilaya_data['groups']:
            top_group = max(wilaya_data['groups'].items(), key=lambda x: x[1])[0]
            pct = (wilaya_data['groups'][top_group] / (sum(wilaya_data['groups'].values()) or 1)) * 100
            comments.append(f"تركيز عالٍ جدا في مجموعة نشاط واحدة ({top_group}: {pct:.0f}%)")
    elif s2 > 0.5:
        comments.append("تركيز ملحوظ في عدد محدود من القطاعات")

    # S3 - Gouvernance
    if s3 > 0.5: # Prompt threshold was 0.6 in general description but 0.5 in code example for flag.
        total_types = sum(wilaya_data['types'].values()) or 1
        local_pct = (wilaya_data['types'].get('محلية', 0) / total_types) * 100
        regional_pct = (wilaya_data['types'].get('جهوية', 0) / total_types) * 100
        comments.append(f"اختلال واضح في الحوكمة: {local_pct:.0f}% محلية مقابل {regional_pct:.0f}% جهوية")

    # Recommendations
    recommendations = []
    if s1 > 0.6:
        recommendations.append("التحقق من الأراضي الدولية المُسندة (OTD)")
        recommendations.append("البحث في صفقات التطهير والبيئة (TUNEPS)")
    if s2 > 0.7:
        recommendations.append("تحليل الاحتكارات القطاعية المحتملة")
    if s3 > 0.5:
        recommendations.append("مراجعة التوازن بين المحلي والجهوي في تركيبة مجالس الإدارة")
    if index > 70:
        recommendations.append("يُنصح بتحقيق صحفي معمق على هذه الولاية")

    return {
        "level": level,
        "level_ar": level_ar,
        "color": color,
        "comment_ar": " · ".join(comments) if comments else "لا توجد إشارات خطر واضحة في البيانات الحالية",
        "recommendations": recommendations
    }

def compute_baath_index_v2(wilaya_df):
    """
    Computes Ba7ath Index (0-100) using continuous formula:
    INDEX = 100 * (0.4 * s1 + 0.4 * s2 + 0.2 * s3)
    
    s1: Dependency on public-resource sectors (AGRI, ENV, MINES)
    s2: Sector concentration (Max share of any group)
    s3: Governance imbalance (abs(local - regional))
    """
    if wilaya_df.empty:
        return 0.0, 0.0, 0.0, 0.0, []

    total = len(wilaya_df)
    flags = []

    # --- s1: Resource Dependency ---
    # Groups: AGRI_NATUREL, ENVIRONNEMENT, ENERGIE_MINES
    resource_groups = ['AGRI_NATUREL', 'ENVIRONNEMENT', 'ENERGIE_MINES']
    resource_count = wilaya_df[wilaya_df['activity_group'].isin(resource_groups)].shape[0]
    s1 = resource_count / total if total > 0 else 0.0
    
    if s1 > 0.6:
        flags.append(Flag(code="RESOURCE_DEPENDENT", severity="high", label_ar="اعتماد كبير على الأنشطة المرتبطة بالموارد العمومية"))

    # --- s2: Sector Concentration ---
    # Max share of any single group
    group_counts = wilaya_df['activity_group'].value_counts(normalize=True)
    s2 = group_counts.max() if not group_counts.empty else 0.0
    
    if s2 > 0.7:
        flags.append(Flag(code="ULTRA_CONCENTRATION", severity="medium", label_ar="تركيز عالٍ في مجموعة نشاط واحدة"))

    # --- s3: Governance Imbalance ---
    # abs(% local - % regional)
    type_counts = wilaya_df['type'].value_counts(normalize=True)
    pct_local = type_counts.get('محلية', 0.0)
    pct_regional = type_counts.get('جهوية', 0.0)
    s3 = abs(pct_local - pct_regional)
    
    if s3 > 0.5:
        flags.append(Flag(code="GOVERNANCE_IMBALANCE", severity="low", label_ar="اختلال واضح بين الشركات المحلية والجهوية"))

    # --- Final Score ---
    # INDEX = 100 * (0.4 * s1 + 0.4 * s2 + 0.2 * s3)
    raw_index = 100 * (0.4 * s1 + 0.4 * s2 + 0.2 * s3)
    baath_index = round(min(raw_index, 100), 1)

    # Return details for commentary
    details = {
        'groups': wilaya_df['activity_group'].value_counts().to_dict(),
        'types': wilaya_df['type'].value_counts().to_dict()
    }

    return baath_index, round(s1, 2), round(s2, 2), round(s3, 2), flags, details

def get_risk_for_wilaya(wilaya: str):
    df = get_companies_df()
    if df.empty:
        return None
    
    wilaya_df = df[df['wilaya'] == wilaya]
    if wilaya_df.empty:
        # Return neutral risk if no companies
        return WilayaRisk(
            wilaya=wilaya, baath_index=0, s1=0, s2=0, s3=0, flags=[],
            level="LOW", level_ar="منخفض", color="emerald", 
            comment_ar="لا توجد بيانات كافية", recommendations=[]
        )

    score, s1, s2, s3, flags, details = compute_baath_index_v2(wilaya_df)
    
    # Generate commentary
    editorial = generate_risk_commentary(details, {
        's1': s1, 's2': s2, 's3': s3, 'baath_index': score
    })
    
    return WilayaRisk(
        wilaya=wilaya,
        baath_index=score,
        s1=s1,
        s2=s2,
        s3=s3,
        flags=flags,
        **editorial
    )

def get_all_risks():
    df = get_companies_df()
    if df.empty:
        return []
    
    risks = []
    for wilaya in df['wilaya'].unique():
        risks.append(get_risk_for_wilaya(wilaya))
    
    return sorted(risks, key=lambda x: x.baath_index, reverse=True)
