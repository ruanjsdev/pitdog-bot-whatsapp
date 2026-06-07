import { Router } from 'express';
import { getSettings, saveSettings } from '../../config/settings.js';

const router = Router();

// GET /settings - Retorna as configurações atuais para o painel
router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
});

// POST /settings - Salva novas configurações vindas do painel
router.post('/', async (req, res) => {
  try {
    const newSettings = req.body;
    // Aqui você pode adicionar validações se quiser
    await saveSettings(newSettings);
    
    console.log('[API] Configurações atualizadas via painel.');
    res.json({ message: 'Configurações salvas com sucesso!', settings: newSettings });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

export { router as settingsRoutes };