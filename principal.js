// ======================================================
// @file principal.js (ou script.js)
// @description Script principal da aplicação Garagem Inteligente. Gerencia a UI,
//              estado da aplicação, interações, persistência e inicialização.
//              *** EFEITOS SONOROS REMOVIDOS ***
// @requires Classes: Veiculo.js, Carro.js, etc. (Carregadas ANTES no HTML)
// @requires Manutencao.js (Carregada ANTES no HTML)
// @requires constants.js (Carregado ANTES no HTML)
// @requires flatpickr.js + l10n/pt.js (Carregado ANTES no HTML)
// @requires CSS (style.css)
// ======================================================

// --- Cache de Elementos DOM ---
/** @type {Object.<string, HTMLElement | null>} */
const Cache = {};

// --- Variáveis Globais de Estado ---
/** @type {Object.<string, Veiculo | null>} */
let garagem = {};
/** @type {string | null} */
let veiculoSelecionado = null;
/** @type {boolean} */
let modoEdicao = false;
/** @type {object | null} */
let flatpickrInstance = null;
/** @type {boolean} */
let isInitialized = false;

// --- EFEITOS SONOROS REMOVIDOS ---
// const sons = {...}; // REMOVIDO
// const soundFiles = {...}; // REMOVIDO
// function carregarSons() {...} // REMOVIDO
// function applyInitialVolumeToSounds() {...} // REMOVIDO

// --- Funções Utilitárias Globais ---

/**
 * Mostra uma notificação. Verifica se a área existe.
 * @param {string} message - A mensagem.
 * @param {'info' | 'success' | 'warning' | 'error'} [type='info'] - O tipo.
 * @param {number} [duration] - Duração em ms. Usa Constants.NOTIFICATION_DURATION ou um padrão.
 * @returns {void}
 */
function showNotification(message, type = 'info', duration) {
    const defaultDuration = (typeof Constants !== 'undefined' && Constants.NOTIFICATION_DURATION) ? Constants.NOTIFICATION_DURATION : 3000;
    const finalDuration = duration ?? defaultDuration;

    if (!Cache.notificationAreaDiv) {
        console.warn("Área de notificação 'notificationAreaDiv' não encontrada.", `[${type}] ${message}`);
        alert(`[${type}] ${message}`);
        return;
    }
    try {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.onclick = () => notification.remove();
        Cache.notificationAreaDiv.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, finalDuration);
    } catch (error) {
        console.error("Erro ao criar ou exibir notificação:", error, { message, type, finalDuration });
    }
}

/**
 * Placeholder para playSound - Evita erros se as classes ainda a chamarem.
 * NÃO TOCA SOM.
 * @param {string} _nomeSom - Ignorado.
 * @param {number} [_volume] - Ignorado.
 * @returns {void}
 */
function playSound(_nomeSom, _volume) {
     // console.log(`Chamada para playSound('${_nomeSom}') ignorada (sons desativados).`);
     // Faz absolutamente nada.
}

/**
 * Atualiza a UI de manutenção. Verifica se os elementos existem.
 * @param {Veiculo | null} veiculo - O veículo ou null.
 * @returns {void}
 */
function updateManutencaoUI(veiculo) {
    const histDiv = Cache.historicoManutencaoListaDiv;
    const agenDiv = Cache.agendamentosFuturosListaDiv;

    if (!histDiv) { console.warn("Elemento 'historicoManutencaoListaDiv' não encontrado no Cache."); }
    if (!agenDiv) { console.warn("Elemento 'agendamentosFuturosListaDiv' não encontrado no Cache."); }

    const histDefault = "<p>Nenhuma manutenção registrada.</p>";
    const agenDefault = "<p>Nenhum agendamento futuro.</p>";

    if (veiculo instanceof Veiculo) {
        if (histDiv) histDiv.innerHTML = typeof veiculo.getHistoricoFormatado === 'function' ? veiculo.getHistoricoFormatado() : histDefault;
        if (agenDiv) agenDiv.innerHTML = typeof veiculo.getAgendamentosFormatados === 'function' ? veiculo.getAgendamentosFormatados() : agenDefault;
        verificarLembretesManutencao(veiculo);
    } else {
        if (histDiv) histDiv.innerHTML = histDefault;
        if (agenDiv) agenDiv.innerHTML = agenDefault;
    }
}

/**
 * Atualiza a área principal de exibição. Verifica cada elemento antes de usar.
 * @param {Veiculo} veiculo - O veículo a exibir.
 * @returns {void}
 */
function updateDisplayContent(veiculo) {
    if (!(veiculo instanceof Veiculo)) {
        console.warn("updateDisplayContent chamada sem instância de Veiculo válida.");
        return;
    }
    // console.log(`Atualizando display para: ${veiculo.getIdentifier()}`);

    const updateText = (element, text) => { if (element) element.textContent = text; };
    const updateHTML = (element, html) => { if (element) element.innerHTML = html; };
    const updateDisplay = (element, display) => { if (element) element.style.display = display; };
    const updateSrc = (element, src) => { if (element) element.src = src; };
    const updateAlt = (element, alt) => { if (element) element.alt = alt; };
    const updateWidth = (element, width) => { if (element) element.style.width = width; };
    const updateBgColor = (element, color) => { if (element) element.style.backgroundColor = color; };

    updateHTML(Cache.informacoesVeiculoDiv, typeof veiculo.exibirInformacoes === 'function' ? veiculo.exibirInformacoes() : 'Erro ao obter informações.');
    updateText(Cache.nicknameDisplaySpan, veiculo.nickname ? `(${veiculo.nickname})` : '');

    if (Cache.imagemExibidaImg) {
        updateDisplay(Cache.imagemExibidaImg, veiculo.imagem ? 'block' : 'none');
        if (veiculo.imagem) {
            updateSrc(Cache.imagemExibidaImg, veiculo.imagem);
            updateAlt(Cache.imagemExibidaImg, `Imagem de ${veiculo.getIdentifier()}`);
        }
    }

    updateStatusVeiculo(veiculo);
    updateVelocidadeDisplay(veiculo.velocidade);

    const isBicicleta = veiculo instanceof Bicicleta;
    updateDisplay(Cache.fuelDisplayContainerDiv, isBicicleta ? 'none' : 'block');
    if (!isBicicleta && Cache.fuelLevelValorSpan && Cache.fuelLevelBarDiv) {
        const capacity = (veiculo.fuelCapacity && veiculo.fuelCapacity > 0) ? veiculo.fuelCapacity : 1;
        const level = veiculo.fuelLevel ?? 0;
        const percentFuel = Math.max(0, Math.min(100, Math.round((level / capacity) * 100)));
        updateText(Cache.fuelLevelValorSpan, percentFuel.toString());
        updateWidth(Cache.fuelLevelBarDiv, `${percentFuel}%`);
        updateBgColor(Cache.fuelLevelBarDiv, percentFuel < 20 ? '#f44336' : percentFuel < 50 ? '#ff9800' : '#4CAF50');
    }

    const isCaminhao = veiculo instanceof Caminhao;
    updateDisplay(Cache.cargaAtualDisplayDiv ? Cache.cargaAtualDisplayDiv.parentElement : null, isCaminhao ? 'block' : 'none'); // Assumes parent controls display
    if (isCaminhao && Cache.cargaAtualValorSpan) {
         updateText(Cache.cargaAtualValorSpan, `${veiculo.cargaAtual ?? 0}/${veiculo.capacidadeCarga ?? 'N/A'}`);
    }


    const isAviao = veiculo instanceof Aviao;
     updateDisplay(Cache.altitudeDisplayDiv ? Cache.altitudeDisplayDiv.parentElement : null, isAviao ? 'block' : 'none'); // Assumes parent controls display
    if (isAviao && Cache.altitudeValorSpan) {
        updateText(Cache.altitudeValorSpan, `${veiculo.altitude ?? 0} m`);
    }

    // Atualiza nome da música (funcionalidade mantida)
    updateText(Cache.nomeMusicaDiv, `Música: ${veiculo.musicaNome || 'Nenhuma'}`);

    // Visibilidade de Botões Específicos
    const isEsportivo = veiculo instanceof CarroEsportivo;
    const setButtonDisplay = (selector, condition) => {
        const btn = document.querySelector(selector);
        if (btn) btn.style.display = condition ? 'inline-block' : 'none';
    };
    setButtonDisplay('button[data-acao="turbo"]', isEsportivo);
    setButtonDisplay('#btnCarregar', isCaminhao);
    setButtonDisplay('#btnDescarregar', isCaminhao);
    setButtonDisplay('#btnDecolar', isAviao);
    setButtonDisplay('#btnAterrissar', isAviao);
    setButtonDisplay('#btnReabastecer', !isBicicleta);
    setButtonDisplay('button[data-acao="ligar"]', !isBicicleta);
    setButtonDisplay('button[data-acao="desligar"]', !isBicicleta);
}


/**
 * Salva a garagem no Local Storage. Adiciona try-catch robusto.
 * @returns {void}
 */
function salvarGaragem() {
    try {
        // console.log("Tentando salvar garagem...", garagem);
        const dataToSave = Object.entries(garagem).reduce((acc, [key, veiculoInstance]) => {
            if (veiculoInstance instanceof Veiculo && typeof veiculoInstance.toPlainObject === 'function') {
                try {
                    acc[key] = veiculoInstance.toPlainObject();
                } catch (error) {
                     console.error(`Erro ao serializar ${key} (${veiculoInstance?.constructor?.name}):`, error);
                     acc[key] = null;
                }
            } else {
                acc[key] = null;
            }
            return acc;
        }, {});

        const jsonData = JSON.stringify(dataToSave);
        localStorage.setItem(Constants.STORAGE_KEY, jsonData);
        // console.log("Garagem salva com sucesso.");

    } catch (e) {
        console.error("Erro CRÍTICO ao salvar dados da garagem no LocalStorage:", e);
        showNotification("ERRO GRAVE: Não foi possível salvar os dados da garagem!", 'error', 6000);
    }
}


// --- Funções Internas do Script ---

/** Atualiza display de velocidade. Verifica elementos. */
function updateVelocidadeDisplay(velocidade) {
    if (!Cache.velocidadeValorSpan || !Cache.progressoVelocidadeDiv) return;
    const vel = Math.max(0, velocidade ?? 0);
    Cache.velocidadeValorSpan.textContent = Math.round(vel).toString();
    const maxSpeed = (typeof Constants !== 'undefined' && Constants.MAX_VISUAL_SPEED > 0) ? Constants.MAX_VISUAL_SPEED : 100;
    const percent = Math.min(100, Math.max(0, (vel / maxSpeed) * 100));
    Cache.progressoVelocidadeDiv.style.width = `${percent}%`;
}

/** Atualiza o status visual. Verifica elemento. */
function updateStatusVeiculo(veiculo) {
    if (!Cache.statusVeiculoDiv) return;
    let text = "N/A";
    let className = "status-desligado";

    if (veiculo instanceof Bicicleta) {
        text = "Pronta"; className = "status-pronta";
    } else if (veiculo instanceof Veiculo) {
        if (veiculo.ligado) { text = "Ligado"; className = "status-ligado"; }
        else { text = "Desligado"; className = "status-desligado"; }
    }
    Cache.statusVeiculoDiv.textContent = text;
    Cache.statusVeiculoDiv.className = `status-veiculo ${className}`;
}

// function updateVolume() {...} // REMOVIDO

/** Verifica lembretes de manutenção. */
function verificarLembretesManutencao(veiculo) {
    if (!(veiculo instanceof Veiculo) || !Array.isArray(veiculo.historicoManutencao)) return;

    try {
        const hoje = new Date(); hoje.setUTCHours(0, 0, 0, 0);
        const amanha = new Date(hoje); amanha.setUTCDate(hoje.getUTCDate() + 1);

        veiculo.historicoManutencao
            .filter(m => m instanceof Manutencao && typeof m.isAgendamento === 'function' && m.isAgendamento())
            .forEach(m => {
                const dataManutencao = (typeof m.getDataObj === 'function') ? m.getDataObj() : null;
                if (dataManutencao instanceof Date && !isNaN(dataManutencao)) {
                    if (dataManutencao.getTime() === hoje.getTime()) {
                        showNotification(`LEMBRETE HOJE: ${m.tipo} p/ ${veiculo.getIdentifier()}`, 'warning', 7000);
                    } else if (dataManutencao.getTime() === amanha.getTime()) {
                        showNotification(`LEMBRETE AMANHÃ: ${m.tipo} p/ ${veiculo.getIdentifier()}`, 'info', 7000);
                    }
                }
            });
    } catch (error) {
        console.error("Erro ao verificar lembretes de manutenção:", error);
    }
}

/**
 * Carrega a garagem do LocalStorage. Com mais tratamento de erro.
 * @returns {void}
 */
function carregarGaragem() {
    if (typeof Constants === 'undefined' || !Constants.STORAGE_KEY) {
        console.error("Constants.STORAGE_KEY não está definido! Não é possível carregar a garagem.");
        showNotification("Erro de configuração: Chave de armazenamento faltando.", "error");
        garagem = { carro: null, esportivo: null, caminhao: null, aviao: null, moto: null, bicicleta: null };
        return;
    }

    const garagemInicial = { carro: null, esportivo: null, caminhao: null, aviao: null, moto: null, bicicleta: null };
    garagem = { ...garagemInicial };

    let dadosSalvos;
    try {
        dadosSalvos = localStorage.getItem(Constants.STORAGE_KEY);
        if (!dadosSalvos) { console.log("Nenhum dado salvo."); return; }
    } catch (error) {
        console.error("Erro ao ACESSAR o LocalStorage:", error);
        showNotification("Erro ao acessar dados salvos.", "error"); return;
    }

    let garagemSalva;
    try {
        garagemSalva = JSON.parse(dadosSalvos);
        if (typeof garagemSalva !== 'object' || garagemSalva === null) throw new Error("Dados salvos inválidos.");
    } catch (e) {
        console.error("Erro ao PARSEAR dados:", e);
        showNotification("ERRO GRAVE: Dados salvos corrompidos. Resetando.", 'error', 6000);
        try { localStorage.removeItem(Constants.STORAGE_KEY); } catch (ign) {}
        garagem = { ...garagemInicial }; return;
    }

    // console.log("Dados crus carregados:", garagemSalva);

    for (const tipo in garagemInicial) {
        if (!Object.hasOwn(garagemSalva, tipo)) continue;
        const vd = garagemSalva[tipo];
        if (!vd || typeof vd !== 'object') { garagem[tipo] = null; continue; }

        try {
            if (typeof Manutencao === 'undefined' || typeof Veiculo === 'undefined') throw new Error("Classes base não carregadas.");

            const historicoRecriado = (Array.isArray(vd.historicoManutencao) ? vd.historicoManutencao : [])
                .map(m => { try { return (typeof Manutencao.fromPlainObject === 'function') ? Manutencao.fromPlainObject(m) : null; } catch { return null; } })
                .filter(m => m instanceof Manutencao);

            const { modelo = '?', cor = '?', tipoVeiculo, nickname = null, imagem = null, ligado = false, velocidade = 0,
                    fuelLevel = (typeof Constants !== 'undefined' ? Constants.DEFAULT_FUEL : 100),
                    fuelCapacity = (typeof Constants !== 'undefined' ? Constants.DEFAULT_FUEL_CAPACITY : 100), // MANTIDO, mas não usado para som
                    volume = 0.5, // Mantido aqui, mas não usado para efeitos sonoros
                    musicaNome = "Nenhuma música selecionada", // MANTIDO
                    turboAtivado = false, capacidadeCarga = 0, cargaAtual = 0, envergadura = 0, altitude = 0, voando = false, tipo: tipoBicicleta = 'urbana' } = vd;

            if (!tipoVeiculo) throw new Error(`'tipoVeiculo' ausente para ${tipo}`);

            let vr = null;
            switch (tipoVeiculo) {
                case 'Carro':          if (typeof Carro !== 'undefined') vr = new Carro(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoRecriado); break;
                case 'CarroEsportivo': if (typeof CarroEsportivo !== 'undefined') vr = new CarroEsportivo(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoRecriado, turboAtivado); break;
                case 'Caminhao':       if (typeof Caminhao !== 'undefined') vr = new Caminhao(modelo, cor, nickname, capacidadeCarga, imagem, ligado, velocidade, fuelLevel, historicoRecriado, cargaAtual); break;
                case 'Aviao':          if (typeof Aviao !== 'undefined') vr = new Aviao(modelo, cor, nickname, envergadura, imagem, ligado, velocidade, fuelLevel, historicoRecriado, altitude, voando); break;
                case 'Moto':           if (typeof Moto !== 'undefined') vr = new Moto(modelo, cor, nickname, imagem, ligado, velocidade, fuelLevel, historicoRecriado); break;
                case 'Bicicleta':      if (typeof Bicicleta !== 'undefined') vr = new Bicicleta(modelo, cor, nickname, tipoBicicleta, imagem, velocidade, historicoRecriado); break;
                default: console.warn(`Tipo desconhecido: ${tipoVeiculo}`);
            }

            if (vr instanceof Veiculo) {
                vr.volume = volume; // O volume da MÚSICA ainda pode ser útil
                vr.musicaNome = musicaNome; // MANTIDO
                vr.fuelCapacity = fuelCapacity;
                vr.musica = null; // MANTIDO
                vr.musicaTocando = false; // MANTIDO
                garagem[tipo] = vr;
                // console.log(`Veículo ${tipo} (${tipoVeiculo}) recriado.`);
            } else { throw new Error(`Falha ao recriar ${tipo} (${tipoVeiculo}).`); }

        } catch (error) {
            console.error(`Erro ao processar ${tipo}:`, error, vd);
            showNotification(`Erro ao carregar ${tipo}.`, 'error');
            garagem[tipo] = null;
        }
    }
    console.log("Garagem final carregada:", garagem);
}


/** Helper para mostrar/esconder elemento. */
function showElement(element, displayType = 'block') { if (element) element.style.display = displayType; }
/** Helper para esconder elemento. */
function hideElement(element) { if (element) element.style.display = 'none'; }

/** Configura UI para criação. */
function showVehicleCreationView() {
    if (!veiculoSelecionado) return;
    // console.log("Configurando UI para CRIAÇÃO de:", veiculoSelecionado);

    const tipoTexto = veiculoSelecionado.charAt(0).toUpperCase() + veiculoSelecionado.slice(1);
    if (Cache.tipoSelecionadoInfoDiv) Cache.tipoSelecionadoInfoDiv.textContent = `Tipo: ${tipoTexto} (Novo)`;

    showElement(Cache.criarVeiculoSection);
    hideElement(Cache.informacoesVeiculoSection); hideElement(Cache.acoesVeiculoSection);
    hideElement(Cache.musicaVeiculoSection); hideElement(Cache.manutencaoVeiculoSection);
    hideElement(Cache.btnMostrarModificarForm); hideElement(Cache.btnCancelarModificar);
    modoEdicao = false;

    if (Cache.criarModificarTituloH2) Cache.criarModificarTituloH2.textContent = `Criar Novo ${tipoTexto}`;
    if (Cache.btnCriarVeiculo) Cache.btnCriarVeiculo.textContent = "Criar Veículo";

    resetCreateForm();
    configureCreateFormFields(veiculoSelecionado);

    if (Cache.informacoesVeiculoDiv) Cache.informacoesVeiculoDiv.textContent = 'Preencha os dados para criar.';
    if (Cache.nicknameDisplaySpan) Cache.nicknameDisplaySpan.textContent = '';
    if (Cache.imagemExibidaImg) Cache.imagemExibidaImg.style.display = 'none';
    updateVelocidadeDisplay(0);
    updateStatusVeiculo(null);
    const isBicicleta = veiculoSelecionado === 'bicicleta';
    if (Cache.fuelDisplayContainerDiv) Cache.fuelDisplayContainerDiv.style.display = isBicicleta ? 'none' : 'block';
    if (Cache.cargaAtualDisplayDiv) Cache.cargaAtualDisplayDiv.style.display = 'none'; // Container pai controla
    if (Cache.altitudeDisplayDiv) Cache.altitudeDisplayDiv.style.display = 'none'; // Container pai controla
    updateManutencaoUI(null);
}

/** Configura UI para detalhes. */
function showVehicleDetailsView(veiculo) {
    if (!veiculo) return;
    // console.log("Configurando UI para DETALHES de:", veiculo.getIdentifier());

    const tipoTexto = veiculoSelecionado.charAt(0).toUpperCase() + veiculoSelecionado.slice(1);
    if (Cache.tipoSelecionadoInfoDiv) Cache.tipoSelecionadoInfoDiv.textContent = `Tipo: ${tipoTexto} (${veiculo.getIdentifier()})`;

    hideElement(Cache.criarVeiculoSection);
    showElement(Cache.informacoesVeiculoSection); showElement(Cache.acoesVeiculoSection);
    showElement(Cache.manutencaoVeiculoSection);
    showElement(Cache.btnMostrarModificarForm, 'inline-block'); hideElement(Cache.btnCancelarModificar);

    if (Cache.musicaVeiculoSection) { // Música mantida
        Cache.musicaVeiculoSection.style.display = (veiculo instanceof Bicicleta) ? 'none' : 'block';
    }
    modoEdicao = false;

    updateDisplayContent(veiculo);
    updateManutencaoUI(veiculo);

    if (Cache.criarModificarTituloH2) Cache.criarModificarTituloH2.textContent = `Modificar ${tipoTexto}`;
    if (Cache.btnCriarVeiculo) Cache.btnCriarVeiculo.textContent = "Salvar Modificações";
}

/** Configura UI para modificação. */
function showVehicleModificationView(veiculo) {
    if (!veiculo) return;
    // console.log("Configurando UI para MODIFICAÇÃO de:", veiculo.getIdentifier());

    const tipoTexto = veiculoSelecionado.charAt(0).toUpperCase() + veiculoSelecionado.slice(1);
    modoEdicao = true;

    hideElement(Cache.informacoesVeiculoSection); hideElement(Cache.acoesVeiculoSection);
    hideElement(Cache.musicaVeiculoSection); hideElement(Cache.manutencaoVeiculoSection);
    hideElement(Cache.btnMostrarModificarForm);
    showElement(Cache.criarVeiculoSection); showElement(Cache.btnCancelarModificar, 'inline-block');

    prefillModifyForm(veiculo);
    configureCreateFormFields(veiculoSelecionado);

    if (Cache.criarModificarTituloH2) Cache.criarModificarTituloH2.textContent = `Modificar ${tipoTexto} (${veiculo.getIdentifier()})`;
    if (Cache.btnCriarVeiculo) Cache.btnCriarVeiculo.textContent = "Salvar Modificações";

    document.getElementById('image-help-text')?.remove();
    if (Cache.imagemInput?.parentNode) {
        const helpText = document.createElement('small');
        helpText.id = 'image-help-text';
        helpText.textContent = ' Deixe vazio para manter a imagem atual.';
        helpText.style.cssText = 'display: block; font-size: 0.8em; color: #666;';
        Cache.imagemInput.parentNode.insertBefore(helpText, Cache.imagemInput.nextSibling);
    }
}

/** Função central da UI. */
function updateUIForSelectedVehicle() {
    // console.log("Atualizando UI para seleção:", veiculoSelecionado);
    if (!Cache.detalhesVeiculoContainer || !Cache.tipoSelecionadoInfoDiv) {
        console.error("Elementos UI essenciais não encontrados!");
        showNotification("Erro interno da UI.", "error"); return;
    }

    document.getElementById('image-help-text')?.remove();
    configureCreateFormFields(null);
    modoEdicao = false;

    if (!veiculoSelecionado) {
        hideElement(Cache.detalhesVeiculoContainer);
        Cache.tipoSelecionadoInfoDiv.textContent = 'Nenhum tipo selecionado.'; return;
    }

    showElement(Cache.detalhesVeiculoContainer);
    const veiculo = garagem[veiculoSelecionado];

    if (veiculo instanceof Veiculo) showVehicleDetailsView(veiculo);
    else showVehicleCreationView();
}

/** Mostra/Esconde campos específicos (opera nos containers .campo-especifico). */
function configureCreateFormFields(tipo) {
    // Esconde todos primeiro
    document.querySelectorAll('.campo-especifico').forEach(el => el.style.display = 'none');
    // Mostra o necessário
    if (tipo === 'caminhao') showElement(document.getElementById('campoCapacidadeCarga'));
    if (tipo === 'aviao') showElement(document.getElementById('campoEnvergadura'));
    if (tipo === 'bicicleta') showElement(document.getElementById('campoTipoBicicleta'));
}

/** Limpa formulário. */
function resetCreateForm() {
    const formElement = Cache.formCriarModificar; // Usa ID do form agora
    if (formElement?.reset) {
        formElement.reset();
        if (Cache.imagemInput) Cache.imagemInput.value = '';
        if (Cache.tipoBicicletaSelect) Cache.tipoBicicletaSelect.selectedIndex = 0;
    } else {
        console.warn("Formulário #formCriarModificar não encontrado ou sem reset().");
        // Limpeza manual (menos completa)
        if (Cache.modeloInput) Cache.modeloInput.value = '';
        if (Cache.corInput) Cache.corInput.value = '';
        // ... outros campos ...
    }
    document.getElementById('image-help-text')?.remove();
}

/** Preenche formulário para edição. */
function prefillModifyForm(veiculo) {
    if (!veiculo) return;
    // console.log("Preenchendo formulário para modificar:", veiculo.getIdentifier());
    const setInputValue = (input, value) => { if (input) input.value = value ?? ''; };

    setInputValue(Cache.modeloInput, veiculo.modelo);
    setInputValue(Cache.corInput, veiculo.cor);
    setInputValue(Cache.nicknameInput, veiculo.nickname);
    setInputValue(Cache.imagemInput, '');

    if (veiculo instanceof Caminhao) setInputValue(Cache.capacidadeCargaInput, veiculo.capacidadeCarga);
    if (veiculo instanceof Aviao) setInputValue(Cache.envergaduraInput, veiculo.envergadura);
    if (veiculo instanceof Bicicleta) setInputValue(Cache.tipoBicicletaSelect, veiculo.tipo);
}

/** Configura event listeners. */
function setupEventListeners() {
    console.log("Configurando event listeners...");

    // Seleção de Tipo (Delegação)
    Cache.selecaoVeiculoSection?.addEventListener('click', (event) => {
        if (event.target.matches('button[data-tipo]')) {
            const tipoClicado = event.target.dataset.tipo;
            // console.log("Botão tipo clicado:", tipoClicado);
            if (tipoClicado !== veiculoSelecionado) { veiculoSelecionado = tipoClicado; updateUIForSelectedVehicle(); }
        }
    });

    // Botões Modificar/Cancelar
    Cache.btnMostrarModificarForm?.addEventListener("click", () => {
        const veiculo = garagem[veiculoSelecionado];
        if (veiculo) showVehicleModificationView(veiculo);
        else showNotification("Nenhum veículo para modificar.", "warning");
    });
    Cache.btnCancelarModificar?.addEventListener("click", () => {
        if (modoEdicao) { modoEdicao = false; updateUIForSelectedVehicle(); }
    });

    // Botão Criar/Salvar (usa type="button" no HTML, listener de clique)
    Cache.btnCriarVeiculo?.addEventListener("click", handleCreateModifyVehicle);

    // Ações do Veículo (Delegação)
    Cache.acoesVeiculoSection?.addEventListener("click", handleVehicleAction);

    // Controles de Música (Mantidos)
    Cache.btnTocarMusica?.addEventListener("click", handlePlayMusic);
    Cache.btnPararMusica?.addEventListener("click", handleStopMusic);
    Cache.musicaInputElement?.addEventListener("change", handleMusicFileSelect);

    // Form de Manutenção
    Cache.formAgendarManutencao?.addEventListener('submit', handleMaintenanceSubmit);

    // Controle de Volume REMOVIDO
    // Cache.volumeGeralInput?.addEventListener("input", updateVolume); // REMOVIDO

     console.log("Configuração de event listeners concluída.");
}


// --- Event Handlers ---

/** Handler para criar/modificar. */
function handleCreateModifyVehicle() {
    // console.log(`Botão Criar/Salvar. Modo Edição: ${modoEdicao}, Tipo: ${veiculoSelecionado}`);
    if (!veiculoSelecionado) { showNotification("Selecione um tipo!", 'warning'); return; }

    const modelo = Cache.modeloInput?.value.trim();
    const cor = Cache.corInput?.value.trim();
    if (!modelo || !cor) { showNotification("Modelo e Cor obrigatórios!", 'error'); Cache.modeloInput?.focus(); return; }
    const nickname = Cache.nicknameInput?.value.trim() || null;

    let capacidade = null, envergadura = null, tipoBike = null;
    try {
        if (veiculoSelecionado === 'caminhao') {
            if (!Cache.capacidadeCargaInput) throw new Error("Campo Capacidade não encontrado.");
            capacidade = parseInt(Cache.capacidadeCargaInput.value);
            if (isNaN(capacidade) || capacidade < 0) { Cache.capacidadeCargaInput.focus(); throw new Error("Capacidade inválida."); } // Permite 0
        } else if (veiculoSelecionado === 'aviao') {
            if (!Cache.envergaduraInput) throw new Error("Campo Envergadura não encontrado.");
            envergadura = parseFloat(Cache.envergaduraInput.value);
            if (isNaN(envergadura) || envergadura <= 0) { Cache.envergaduraInput.focus(); throw new Error("Envergadura inválida."); }
        } else if (veiculoSelecionado === 'bicicleta') {
             if (!Cache.tipoBicicletaSelect) throw new Error("Campo Tipo Bicicleta não encontrado.");
            tipoBike = Cache.tipoBicicletaSelect.value;
            if (!tipoBike) { Cache.tipoBicicletaSelect.focus(); throw new Error("Selecione o tipo."); }
        }
    } catch (error) { showNotification(`Erro: ${error.message}`, 'error'); return; }

    const veiculoExistente = garagem[veiculoSelecionado];
    const isModifying = veiculoExistente instanceof Veiculo && modoEdicao;
    // console.log("Dados validados. Modificando:", isModifying);

    const assignVehicle = (imagemURL = null) => {
        // console.log("assignVehicle com imagemURL:", imagemURL ? 'Sim' : 'Não');
        let veiculoProcessado = null;
        const defaultFuel = typeof Constants !== 'undefined' ? Constants.DEFAULT_FUEL : 100;
        const defaultFuelCap = typeof Constants !== 'undefined' ? Constants.DEFAULT_FUEL_CAPACITY : 100;
        const defaultVolume = 0.5; // Default para música

        const hist = isModifying ? (veiculoExistente.historicoManutencao ?? []) : [];
        const ligado = isModifying ? (veiculoExistente.ligado ?? false) : false;
        const vel = isModifying ? (veiculoExistente.velocidade ?? 0) : 0;
        const vol = isModifying ? (veiculoExistente.volume ?? defaultVolume) : defaultVolume; // Para música
        const mNome = isModifying ? (veiculoExistente.musicaNome ?? "Nenhuma") : "Nenhuma";
        const fuel = isModifying ? (veiculoExistente.fuelLevel ?? defaultFuel) : defaultFuel;
        const fCap = isModifying ? (veiculoExistente.fuelCapacity ?? defaultFuelCap) : defaultFuelCap;
        const trb = (isModifying && veiculoExistente instanceof CarroEsportivo) ? (veiculoExistente.turboAtivado ?? false) : false;
        const car = (isModifying && veiculoExistente instanceof Caminhao) ? (veiculoExistente.cargaAtual ?? 0) : 0;
        const alt = (isModifying && veiculoExistente instanceof Aviao) ? (veiculoExistente.altitude ?? 0) : 0;
        const voa = (isModifying && veiculoExistente instanceof Aviao) ? (veiculoExistente.voando ?? false) : false;

        try {
            const finalImg = imagemURL ? imagemURL : (isModifying ? veiculoExistente.imagem : null);
            // console.log("Criando instância para:", veiculoSelecionado);

             switch (veiculoSelecionado) { // Verifica classes antes de new
                case 'carro':          if(typeof Carro !== 'undefined') veiculoProcessado = new Carro(modelo, cor, nickname, finalImg, ligado, vel, fuel, hist); break;
                case 'esportivo':      if(typeof CarroEsportivo !== 'undefined') veiculoProcessado = new CarroEsportivo(modelo, cor, nickname, finalImg, ligado, vel, fuel, hist, trb); break;
                case 'caminhao':       if(typeof Caminhao !== 'undefined') veiculoProcessado = new Caminhao(modelo, cor, nickname, capacidade, finalImg, ligado, vel, fuel, hist, car); break;
                case 'aviao':          if(typeof Aviao !== 'undefined') veiculoProcessado = new Aviao(modelo, cor, nickname, envergadura, finalImg, ligado, vel, fuel, hist, alt, voa); break;
                case 'moto':           if(typeof Moto !== 'undefined') veiculoProcessado = new Moto(modelo, cor, nickname, finalImg, ligado, vel, fuel, hist); break;
                case 'bicicleta':      if(typeof Bicicleta !== 'undefined') veiculoProcessado = new Bicicleta(modelo, cor, nickname, tipoBike, finalImg, vel, hist); break;
                default: throw new Error(`Tipo inválido: ${veiculoSelecionado}`);
            }
            if (!(veiculoProcessado instanceof Veiculo)) throw new Error(`Falha ao criar ${veiculoSelecionado}.`);

            veiculoProcessado.volume = vol; // Volume da música
            veiculoProcessado.musicaNome = mNome;
            veiculoProcessado.fuelCapacity = fCap;
            veiculoProcessado.musica = (isModifying && veiculoExistente.musica) ? veiculoExistente.musica : null;
            veiculoProcessado.musicaTocando = (isModifying && veiculoExistente.musicaTocando && veiculoProcessado.musica === veiculoExistente.musica);

            garagem[veiculoSelecionado] = veiculoProcessado;
            salvarGaragem();
            showNotification(`Veículo ${isModifying ? 'modificado' : 'criado'}!`, 'success');
            modoEdicao = false;
            updateUIForSelectedVehicle();

        } catch (error) {
            console.error("Erro DENTRO de assignVehicle:", error);
            showNotification(`Erro: ${error.message}`, 'error');
        } finally { document.getElementById('image-help-text')?.remove(); }
    };

    const imagemFile = Cache.imagemInput?.files?.[0];
    if (imagemFile) {
        // console.log("Processando imagem:", imagemFile.name);
        if (!imagemFile.type.startsWith('image/')) { showNotification("Arquivo inválido.", 'error'); Cache.imagemInput.value = ''; return; }
        const reader = new FileReader();
        reader.onload = (e) => assignVehicle(e.target?.result);
        reader.onerror = (e) => { console.error("Erro lendo imagem:", e); showNotification("Erro ao ler imagem.", 'error'); assignVehicle(); };
        reader.readAsDataURL(imagemFile);
    } else { /* console.log("Nenhuma imagem nova.");*/ assignVehicle(); }
}


/** Handler para ações. */
function handleVehicleAction(event) {
    const button = event.target.closest('button[data-acao]');
    if (!button) return;
    const acao = button.dataset.acao;
    const veiculo = garagem[veiculoSelecionado];
    // console.log(`Ação '${acao}' clicada para '${veiculoSelecionado}'`);

    if (!veiculo) { showNotification("Nenhum veículo selecionado!", 'warning'); return; }

    try {
        // console.log(`Executando '${acao}' em:`, veiculo);
        switch (acao) {
            case 'ligar':       veiculo.ligar(); break;
            case 'desligar':    veiculo.desligar(); break;
            case 'acelerar':    veiculo.acelerar(10); break;
            case 'frear':       veiculo.frear(10); break;
            case 'buzinar':     veiculo.buzinar(); break; // Ainda chama buzinar, mas playSound interno não fará nada
            case 'reabastecer': veiculo.reabastecer(); break;
            case 'turbo':
                if (veiculo instanceof CarroEsportivo) veiculo.ativarTurbo();
                else showNotification("Ação 'Turbo' inválida.", "warning");
                break;
            case 'carregar':
                if (veiculo instanceof Caminhao) {
                    const maxCarga = (veiculo.capacidadeCarga ?? 0) - (veiculo.cargaAtual ?? 0);
                    const qStr = prompt(`Quanto carregar? (Max: ${maxCarga})`, `${maxCarga}`);
                    if (qStr !== null) veiculo.carregar(qStr);
                } else showNotification("Ação 'Carregar' inválida.", "warning");
                break;
            case 'descarregar':
                 if (veiculo instanceof Caminhao) {
                     const qStr = prompt(`Quanto descarregar? (Atual: ${veiculo.cargaAtual ?? 0})`, `${veiculo.cargaAtual ?? 0}`);
                     if (qStr !== null) veiculo.descarregar(qStr);
                 } else showNotification("Ação 'Descarregar' inválida.", "warning");
                 break;
            case 'decolar':
                if (veiculo instanceof Aviao) veiculo.decolar();
                else showNotification("Ação 'Decolar' inválida.", "warning");
                break;
            case 'aterrissar':
                if (veiculo instanceof Aviao) veiculo.aterrissar();
                else showNotification("Ação 'Aterrissar' inválida.", "warning");
                break;
            default: showNotification(`Ação desconhecida: "${acao}".`, "warning");
        }
    } catch (error) {
        console.error(`Erro na ação "${acao}":`, error);
        showNotification(`Erro: ${error.message}`, 'error');
    }
}

// --- Handlers de Música (Mantidos) ---
function handlePlayMusic() {
    const v = garagem[veiculoSelecionado];
    // console.log("Tocar Música clicado.");
    if (v instanceof Veiculo && !(v instanceof Bicicleta)) {
        if (typeof v.tocarMusica === 'function') v.tocarMusica();
        else console.error("Método tocarMusica não encontrado.");
    } else if (v instanceof Bicicleta) { showNotification("Bicicletas não tocam música.", 'info'); }
    else { showNotification("Selecione um veículo motorizado.", 'warning'); }
}
function handleStopMusic() {
    const v = garagem[veiculoSelecionado];
    // console.log("Parar Música clicado.");
    if (v instanceof Veiculo && !(v instanceof Bicicleta)) {
         if (typeof v.pararMusica === 'function') v.pararMusica();
         else console.error("Método pararMusica não encontrado.");
    }
}
function handleMusicFileSelect(event) {
    // console.log("Arquivo de música selecionado.");
    const input = /** @type {HTMLInputElement} */ (event.target);
    const file = input.files?.[0];
    if (!file) return;
    const veiculo = garagem[veiculoSelecionado];
    if (!veiculo || veiculo instanceof Bicicleta) { showNotification("Selecione veículo motorizado.", 'warning'); input.value = ""; return; }
    if (!file.type.startsWith('audio/')) { showNotification("Arquivo não é áudio.", 'warning'); input.value = ""; return; }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            if (!e.target?.result) throw new Error("Falha ao ler arquivo.");
            const audio = new Audio(e.target.result);
            if (typeof veiculo.setMusica === 'function') {
                veiculo.setMusica(audio, file.name);
                showNotification(`Música "${file.name}" carregada.`, 'success');
            } else { console.error("Método setMusica não encontrado."); showNotification("Erro ao definir música.", "error"); }
        } catch (err) { showNotification(`Erro áudio: ${err.message}`, 'error'); console.error("Erro setando Audio:", err); input.value = ""; }
    };
    reader.onerror = (e) => { showNotification("Erro ao ler arquivo.", 'error'); console.error("FileReader error:", e); input.value = ""; };
    reader.readAsDataURL(file);
}


/** Handler para submit de manutenção. */
function handleMaintenanceSubmit(event) {
    event.preventDefault();
    // console.log("Form manutenção submetido.");
    const veiculo = garagem[veiculoSelecionado];
    if (!veiculo) { showNotification("Selecione um veículo.", 'warning'); return; }

    const data = Cache.manutencaoDataInput?.value;
    const tipo = Cache.manutencaoTipoInput?.value.trim();
    const custoStr = Cache.manutencaoCustoInput?.value;
    const desc = Cache.manutencaoDescricaoTextarea?.value.trim();

    if (!data || !tipo || custoStr === '' || custoStr === null) {
        showNotification("Data, Tipo e Custo obrigatórios.", 'error'); return;
    }

    try {
         if (typeof Manutencao === 'undefined') throw new Error("Classe Manutencao não carregada.");
         if (typeof veiculo.adicionarManutencao !== 'function') throw new Error("Método adicionarManutencao não encontrado.");

        const novaManutencao = new Manutencao(data, tipo, custoStr, desc);
        veiculo.adicionarManutencao(novaManutencao);
        showNotification(`Manutenção "${tipo}" registrada.`, 'success');

        if (Cache.manutencaoTipoInput) Cache.manutencaoTipoInput.value = '';
        if (Cache.manutencaoCustoInput) Cache.manutencaoCustoInput.value = '';
        if (Cache.manutencaoDescricaoTextarea) Cache.manutencaoDescricaoTextarea.value = '';
        flatpickrInstance?.clear();

    } catch (error) {
        showNotification(`Erro manutenção: ${error.message}`, 'error');
        console.error("Erro form manutenção:", error);
    }
}


// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return; isInitialized = true;
    console.log("DOM Carregado. Iniciando Garagem Inteligente (Sem Efeitos Sonoros)...");

    // --- 1. Cache DOM ---
    console.log("Cacheando elementos DOM...");
    const requiredElementIds = ['selecao-veiculo', 'detalhes-veiculo-container', 'criar-veiculo', 'acoes-veiculo', 'manutencao-veiculo', 'formAgendarManutencao', 'btnCriarVeiculo', 'tipoSelecionadoInfo'];
    let missingElements = false;
    // Cache dos elementos (mantido como antes, exceto volumeGeralInput)
    Cache.selecaoVeiculoSection = document.getElementById('selecao-veiculo');
    Cache.detalhesVeiculoContainer = document.getElementById('detalhes-veiculo-container');
    Cache.criarVeiculoSection = document.getElementById('criar-veiculo');
    Cache.informacoesVeiculoSection = document.getElementById('informacoes-veiculo');
    Cache.acoesVeiculoSection = document.getElementById('acoes-veiculo');
    Cache.musicaVeiculoSection = document.getElementById('musica-veiculo'); // Música mantida
    Cache.manutencaoVeiculoSection = document.getElementById('manutencao-veiculo');
    // Cache.configuracaoSomSection = document.getElementById('configuracao-som'); // REMOVIDO
    Cache.tipoSelecionadoInfoDiv = document.getElementById('tipoSelecionadoInfo');
    Cache.criarModificarTituloH2 = document.getElementById('criarModificarTitulo');
    Cache.formCriarModificar = document.getElementById('formCriarModificar'); // Cache do form
    Cache.modeloInput = document.getElementById('modelo');
    Cache.corInput = document.getElementById('cor');
    Cache.nicknameInput = document.getElementById('nickname');
    Cache.imagemInput = document.getElementById('imagem');
    Cache.capacidadeCargaInput = document.getElementById('capacidadeCarga');
    Cache.envergaduraInput = document.getElementById('envergadura');
    Cache.tipoBicicletaSelect = document.getElementById('tipoBicicleta');
    Cache.btnCriarVeiculo = document.getElementById('btnCriarVeiculo');
    Cache.btnCancelarModificar = document.getElementById('btnCancelarModificar');
    Cache.informacoesVeiculoDiv = document.getElementById('informacoesVeiculo');
    Cache.nicknameDisplaySpan = document.getElementById('nicknameDisplay');
    Cache.imagemExibidaImg = document.getElementById('imagemExibida');
    Cache.statusVeiculoDiv = document.getElementById('statusVeiculo');
    Cache.velocidadeValorSpan = document.getElementById('velocidadeValor');
    Cache.progressoVelocidadeDiv = document.getElementById('progressoVelocidade');
    Cache.fuelDisplayContainerDiv = document.getElementById('fuelDisplayContainer');
    Cache.fuelLevelValorSpan = document.getElementById('fuelLevelValor');
    Cache.fuelLevelBarDiv = document.getElementById('fuelLevelBar');
    Cache.cargaAtualDisplayDiv = document.getElementById('cargaAtualDisplay'); // O elemento SPAN
    Cache.cargaAtualValorSpan = document.getElementById('cargaAtualValor');    // O elemento SPAN
    Cache.altitudeDisplayDiv = document.getElementById('altitudeDisplay');     // O elemento SPAN
    Cache.altitudeValorSpan = document.getElementById('altitudeValor');      // O elemento SPAN
    Cache.btnMostrarModificarForm = document.getElementById('btnMostrarModificarForm');
    Cache.musicaInputElement = document.getElementById('musicaInput'); // Música mantida
    Cache.btnTocarMusica = document.getElementById('btnTocarMusica');   // Música mantida
    Cache.btnPararMusica = document.getElementById('btnPararMusica'); // Música mantida
    Cache.nomeMusicaDiv = document.getElementById('nomeMusica');       // Música mantida
    Cache.historicoManutencaoListaDiv = document.getElementById('historicoManutencaoLista');
    Cache.agendamentosFuturosListaDiv = document.getElementById('agendamentosFuturosLista');
    Cache.formAgendarManutencao = document.getElementById('formAgendarManutencao');
    Cache.manutencaoDataInput = document.getElementById('manutencaoData');
    Cache.manutencaoTipoInput = document.getElementById('manutencaoTipo');
    Cache.manutencaoCustoInput = document.getElementById('manutencaoCusto');
    Cache.manutencaoDescricaoTextarea = document.getElementById('manutencaoDescricao');
    // Cache.volumeGeralInput = document.getElementById('volumeGeral'); // REMOVIDO

    requiredElementIds.forEach(id => { if (!document.getElementById(id)) { console.error(`ERRO CRÍTICO: ID '${id}' não encontrado!`); missingElements = true; } });
    if (missingElements) { alert("Erro fatal: Elementos essenciais da UI faltando. Verifique o console."); return; }
    console.log("Cache DOM concluído.");

    // --- 2. Área de Notificação ---
    if (!document.getElementById('notification-area')) {
        Cache.notificationAreaDiv = document.createElement('div'); Cache.notificationAreaDiv.id = 'notification-area'; document.body.appendChild(Cache.notificationAreaDiv);
    } else { Cache.notificationAreaDiv = document.getElementById('notification-area'); }

    // --- 3. Verificar Constantes ---
    if (typeof Constants === 'undefined') { console.error("ERRO CRÍTICO: 'Constants' não definido."); showNotification("Erro config!", "error", 10000); }
     else { console.log("Constants OK."); }

    // --- 4. Carregar Sons REMOVIDO ---
    // carregarSons();

    // --- 5. Carregar Dados ---
    console.log("Carregando garagem...");
    carregarGaragem();

    // --- 6. Volume Inicial REMOVIDO ---
    // Configuração de volume removida

    // --- 7. Inicialização do Flatpickr ---
    console.log("Inicializando Flatpickr...");
    try {
        if (typeof flatpickr === "function" && Cache.manutencaoDataInput) {
            const locale = flatpickr.l10ns?.pt ? 'pt' : 'default';
            flatpickrInstance = flatpickr(Cache.manutencaoDataInput, { dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", locale: locale });
            console.log(`Flatpickr OK (locale: ${locale}).`);
        } else { throw new Error("Flatpickr ou input não encontrado."); }
    } catch (e) {
        console.warn("Flatpickr não inicializado:", e.message, "Usando fallback date nativo.");
        if (Cache.manutencaoDataInput?.type === 'text') { Cache.manutencaoDataInput.type = 'date'; Cache.manutencaoDataInput.placeholder = ''; }
    }

    // --- 8. Configurar Listeners ---
    setupEventListeners();

    // --- 9. UI Inicial ---
    console.log("Atualizando UI inicial...");
    updateUIForSelectedVehicle();
    console.log("Interface inicial definida.");

    // --- Fim ---
    console.log("App inicializado (Sem Efeitos Sonoros).");
    showNotification("Garagem Inteligente Pronta!", "success", 2000);
});// Em js/principal.js (ou js/apiService.js)

/**
 * Busca detalhes extras de um veículo na API simulada (arquivo JSON local).
 * @async
 * @function buscarDetalhesVeiculoAPI
 * @param {string} identificadorVeiculo O ID único do veículo (propriedade 'id' da instância Veiculo).
 * @returns {Promise<object|null>} Uma Promise que resolve com o objeto de dados extras do veículo
 * encontrado no JSON, ou null se não for encontrado ou ocorrer um erro de leitura/parse.
 * @throws {Error} Pode lançar um erro em caso de falha na requisição (ex: 404) ou no parsing do JSON,
 * que deve ser capturado por quem chama a função.
 */
async function buscarDetalhesVeiculoAPI(identificadorVeiculo) {
  const url = './dados_veiculos_api.json'; // Caminho relativo para o arquivo JSON na raiz
  console.log(`[API Sim] Iniciando busca para ID: ${identificadorVeiculo}`);

  try {
    // 1. Faz a requisição para buscar o arquivo
    const response = await fetch(url, { cache: 'no-cache' });
    console.log(`[API Sim] Status da resposta do fetch: ${response.status}`);

    // 2. Verifica se o arquivo foi encontrado
    if (!response.ok) {
      let errorMsg = `Erro ao carregar ${url}: ${response.status} ${response.statusText}`;
      if (response.status === 404) {
        errorMsg = `Erro 404: Arquivo da API simulada (${url}) não encontrado. Verifique o caminho/nome.`;
      }
      throw new Error(errorMsg); // Lança erro
    }

    // 3. Verifica se a resposta é realmente JSON (robustez)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("[API Sim] Resposta recebida não é JSON:", textResponse.substring(0, 200));
        throw new TypeError(`Resposta de ${url} não está no formato JSON.`);
    }

    // 4. Tenta converter a resposta em objeto/array JavaScript
    const dadosCompletos = await response.json();
    console.log("[API Sim] JSON lido e parseado.");

    // 5. Procura pelo veículo no array usando o ID fornecido
    const veiculoEncontrado = dadosCompletos.find(veiculo => veiculo.id_unico === identificadorVeiculo);

    // 6. Retorna o resultado
    if (veiculoEncontrado) {
      console.log(`[API Sim] Detalhes encontrados para ${identificadorVeiculo}.`);
      return veiculoEncontrado;
    } else {
      console.log(`[API Sim] ID ${identificadorVeiculo} não encontrado no JSON.`);
      return null; // Não encontrado
    }

  } catch (error) {
    // 7. Captura qualquer erro do 'try'
    console.error("[API Sim] Erro durante busca/processamento:", error);
    // É importante re-lançar para que o código que chama esta função (o listener)
    // saiba que houve um problema.
    throw error;
  }
}