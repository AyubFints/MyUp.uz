import { query } from '../config/db.js';

// Barcha faol reklamalarni olish (Mobil ilova va sayt uchun)
export const getActiveAds = async (req, res) => {
  try {
    const { side } = req.query;
    let sql = 'SELECT * FROM ads WHERE is_active = true';
    const params = [];

    if (side) {
      sql += ' AND (side = $1 OR side = \'both\')';
      params.push(side);
    }

    sql += ' ORDER BY created_at ASC, id ASC';

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, ads: result.rows });
  } catch (err) {
    console.error('GetActiveAds xatosi:', err);
    res.status(500).json({ success: false, message: 'Reklamalarni yuklashda xatolik.' });
  }
};

// Barcha reklamalarni olish (Super Admin nazorati va Billing uchun)
export const getAllAdminAds = async (req, res) => {
  try {
    const result = await query('SELECT * FROM ads ORDER BY created_at DESC');
    res.json({ success: true, count: result.rows.length, ads: result.rows });
  } catch (err) {
    console.error('GetAllAdminAds xatosi:', err);
    res.status(500).json({ success: false, message: 'Admin reklamalarini yuklashda xatolik.' });
  }
};

// Yangi video / rasm reklama joylashtirish
export const createAd = async (req, res) => {
  try {
    const {
      title,
      description,
      videoUrl,
      video_url,
      mediaUrl,
      media_url,
      imageUrl,
      image_url,
      url,
      targetLink,
      target_link,
      link,
      side = 'both',
      priceUzs,
      price_uzs,
      advertiserName,
      advertiser_name,
      advertiserPhone,
      advertiser_phone,
      endDate,
      end_date,
    } = req.body;

    const finalVideoUrl = videoUrl || video_url || mediaUrl || media_url || imageUrl || image_url || url;
    const finalTargetLink = targetLink || target_link || link || '';
    const finalAdvertiserName = advertiserName || advertiser_name || '';
    const finalAdvertiserPhone = advertiserPhone || advertiser_phone || '';
    const finalPrice = priceUzs ?? price_uzs ?? 0;
    const finalEndDate = endDate || end_date || null;

    if (!title || !finalVideoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Sarlavha va video/rasm manzili kiritilishi shart.',
      });
    }

    const result = await query(
      `INSERT INTO ads (title, description, video_url, target_link, side, price_uzs, advertiser_name, advertiser_phone, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        title.trim(),
        description || '',
        finalVideoUrl,
        finalTargetLink,
        side || 'both',
        finalPrice,
        finalAdvertiserName,
        finalAdvertiserPhone,
        finalEndDate,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Reklama muvaffaqiyatli saqlandi',
      ad: result.rows[0],
    });
  } catch (err) {
    console.error('CreateAd xatosi:', err);
    res.status(500).json({ success: false, message: 'Reklamani saqlashda xatolik.' });
  }
};

// Reklama holatini o'zgartirish (Faollashtirish / To'xtatish)
export const toggleAdStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await query(
      `UPDATE ads SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [Boolean(isActive), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reklama topilmadi.' });
    }

    res.json({ success: true, ad: result.rows[0] });
  } catch (err) {
    console.error('ToggleAdStatus xatosi:', err);
    res.status(500).json({ success: false, message: 'Holatni o\'zgartirishda xatolik.' });
  }
};

// Reklamani o'chirish
export const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM ads WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reklama topilmadi.' });
    }

    res.json({ success: true, message: 'Reklama muvaffaqiyatli o\'chirildi.' });
  } catch (err) {
    console.error('DeleteAd xatosi:', err);
    res.status(500).json({ success: false, message: 'Reklamani o\'chirishda xatolik.' });
  }
};


// Reklama ko'rilganini qayd etish (views_count + 1)
export const recordAdView = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE ads 
       SET views_count = COALESCE(views_count, 0) + 1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, title, views_count, clicks_count`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reklama topilmadi' });
    }

    res.json({ success: true, ad: result.rows[0] });
  } catch (err) {
    console.error('RecordAdView xatosi:', err);
    res.status(500).json({ success: false, message: 'Ko\'rishni yozishda xatolik' });
  }
};

// Reklama havolasi / tugmasi bosilganini qayd etish (clicks_count + 1)
export const recordAdClick = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE ads 
       SET clicks_count = COALESCE(clicks_count, 0) + 1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, title, views_count, clicks_count`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reklama topilmadi' });
    }

    res.json({ success: true, ad: result.rows[0] });
  } catch (err) {
    console.error('RecordAdClick xatosi:', err);
    res.status(500).json({ success: false, message: 'Bosilishni yozishda xatolik' });
  }
};
