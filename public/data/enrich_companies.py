import json

with open("companies.json", "r", encoding="utf-8") as f:
    data = json.load(f)

def normaliser_activite(raw):
    if not raw:
        return "غير مصنف"
    a = raw.strip()

    # Normalisation orthographique simple
    a = a.replace("فلاحة/ ", "فلاحة / ")
    a = a.replace("فلاحة/صيد", "فلاحة / صيد")
    a = a.replace(" /", " / ").replace("  ", " ")

    # AGRI / FORÊTS / PÊCHE
    if "فلاحة" in a or "صيد" in a or "زراعة" in a or "تربية" in a or "حراجة" in a:
        # Regrouper les sous-types
        if "حراجة" in a:
            return "حراجة و استغلال الغابات"
        if "تربية الدواجن" in a:
            return "تربية الدواجن"
        if "تربية" in a:
            return "تربية الحيوانات"
        if "النباتات الصناعية" in a:
            return "زراعة النباتات الصناعية"
        if "الحبوب" in a:
            return "زراعة الحبوب"
        return "فلاحة و صيد و خدمات فلاحية"

    # TRANSPORT
    if "نقل" in a or "النقل البرّي" in a:
        if "منتظم" in a or "المسافرين" in a:
            return "نقل المسافرين"
        if "خدمات ملحقة بالنقل" in a:
            return "خدمات ملحقة بالنقل"
        return "نقل بري و خدماته"

    # ENVIRONNEMENT / DÉCHETS
    if "الرسكلة" in a or "المستعملة" in a or "التطهير" in a or "الفضلات" in a:
        if "التطهير" in a:
            return "تطهير و نظافة و تصرف في الفضلات"
        return "رسكلة المواد المستعملة"

    # ENERGIE / MINES
    if "الكهرباء" in a or "الغاز" in a or "الحرارة" in a:
        return "إنتاج و توزيع الكهرباء و الغاز"
    if "إستخراج الأحجار" in a or "إستخراج" in a:
        return "صناعات إستخراجية"

    # INDUSTRIE / TRANSFORMATION
    if "صناعة" in a or "صنع" in a or "تحويل" in a or "القرميد" in a or "الآجر" in a or "المطاط" in a:
        return "صناعات تحويلية و حرفية"

    # LOISIRS / TOURISME
    if "ترفيهية" in a or "سياحة" in a or "رياضية" in a or "ثقافية" in a:
        return "أنشطة ترفيهية و ثقافية و سياحية"

    # COMMERCE / SERVICES / SOCIAL
    if "تجارة" in a:
        return "تجارة"
    if "خدمات جماعية" in a or "إجتماعية" in a or "شخصية" in a:
        return "خدمات جماعية و إجتماعية"
    if "التعليم" in a:
        return "تعليم"

    return a  # fallback : laisser le texte original

def groupe_activite(norm):
    if any(k in norm for k in ["فلاحة", "زراعة", "تربية", "حراجة"]):
        return "AGRI_NATUREL"
    if any(k in norm for k in ["نقل", "المسافرين"]):
        return "TRANSPORT"
    if any(k in norm for k in ["رسكلة", "تطهير", "الفضلات"]):
        return "ENVIRONNEMENT"
    if any(k in norm for k in ["الكهرباء", "الغاز", "إستخراج"]):
        return "ENERGIE_MINES"
    if any(k in norm for k in ["صناعات تحويلية", "صنع", "صناعة"]):
        return "INDUSTRIE"
    if any(k in norm for k in ["تجارة", "خدمات جماعية", "تعليم"]):
        return "SERVICES_COM"
    if any(k in norm for k in ["ترفيهية", "سياحية"]):
        return "LOISIRS_TOURISME"
    return "AUTRE"

for c in data:
    raw = c.get("الموضوع / النشاط", "")
    norm = normaliser_activite(raw)
    c["activité_normalisée"] = norm
    c["activité_groupe"] = groupe_activite(norm)

with open("companies_normalized.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("✅ companies_normalized.json généré :", len(data), "lignes")
