<?php
require 'db.php';
header('Content-Type: application/json');

// JSON verisini al
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data)) {
    echo json_encode(['error' => 'Gönderilen veri boş veya hatalı.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Cihaz satışı ekle
    $stmt = $pdo->prepare("
        INSERT INTO cihaz_satislari 
        (firma_id, bayi_id, toplam_tutar, odenen_tutar, teslim_durumu, aciklama, 
         odeme_tarihi, kalan_odeme_tarihi, prim_yuzdesi, prim_tutari, kalan_tutar, created_at) 
        VALUES 
        (:firma_id, :bayi_id, :toplam_tutar, :odenen_tutar, :teslim_durumu, :aciklama,
         :odeme_tarihi, :kalan_odeme_tarihi, :prim_yuzdesi, :prim_tutari, :kalan_tutar, NOW())
    ");

    // Prim tutarını hesapla
    $prim_tutari = ($data['toplam_tutar'] * $data['prim_yuzdesi']) / 100;
    // Kalan tutarı hesapla
    $kalan_tutar = $data['toplam_tutar'] - $data['odenen_tutar'];

    $stmt->execute([
        ':firma_id' => $data['firma_id'],
        ':bayi_id' => $data['bayi_id'],
        ':toplam_tutar' => $data['toplam_tutar'],
        ':odenen_tutar' => $data['odenen_tutar'],
        ':teslim_durumu' => $data['teslim_durumu'],
        ':aciklama' => $data['aciklama'],
        ':odeme_tarihi' => $data['odeme_tarihi'],
        ':kalan_odeme_tarihi' => $data['kalan_odeme_tarihi'],
        ':prim_yuzdesi' => $data['prim_yuzdesi'],
        ':prim_tutari' => $prim_tutari,
        ':kalan_tutar' => $kalan_tutar
    ]);

    $satis_id = $pdo->lastInsertId();
    
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Cihaz satışı başarıyla eklendi.',
        'id' => $satis_id
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>
