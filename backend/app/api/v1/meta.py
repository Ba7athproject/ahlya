from fastapi import APIRouter

router = APIRouter()

@router.get("/methodology")
def methodology():
    return {
        "title": "Methodology",
        "description": "How we process data and compute metrics.",
        "content_ar": """
        تم استخراج البيانات من السجل الوطني للشركات الأهلية (alahlia.tn). 
        
        مؤشر 'بحث' (Ba7ath Index) هو مؤشر مركب يقيس ثلاث أبعاد رئيسية (0-100):
        1. الاعتماد على الموارد العمومية (40%): نسبة الشركات في قطاعات الفلاحة، المناجم، والبيئة.
        2. التركيز القطاعي (40%): مدى هيمنة قطاع واحد على اقتصاد الجهة.
        3. التوازن المحلي/الجهوي (20%): الفرق بين نسبة الشركات المحلية والجهوية.
        
        صيغة الاحتساب: INDEX = 100 * (0.4 * s1 + 0.4 * s2 + 0.2 * s3)
        """
    }

@router.get("/sources")
def sources():
    return [
        {"name": "RNE", "url": "https://www.registre-entreprises.tn", "description_ar": "للتثبت من الوضعية القانونية للشركة."},
        {"name": "JORT", "url": "http://www.iort.gov.tn", "description_ar": "للبحث عن النصوص التأسيسية."},
        {"name": "INS", "url": "http://www.ins.tn", "description_ar": "للمقارنة مع الإحصائيات الرسمية."}
    ]
