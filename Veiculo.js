// ======================================================
// Arquivo: js/Veiculo.js
// Descrição: Classe base para todos os veículos.
// ======================================================



// Importar Subclasses é necessário para 'instanceof' funcionar corretamente aqui
// Nota: Isso pode parecer estranho, mas é como garantimos que o JS conheça essas classes
// quando Veiculo.js for avaliado. Módulos ES6 lidam com isso.




// Importar funções/objetos necessários do script principal (ACoplamento!)


 class Veiculo {
    modelo; cor; nickname; imagem; ligado; velocidade; volume;
    musica; musicaTocando; musicaNome;
    fuelCapacity; fuelLevel; historicoManutencao;

    constructor(modelo, cor, nickname = null, imagem = null, ligado = false, velocidade = 0, fuelLevel = Constants.DEFAULT_FUEL, historicoManutencao = []) {
        if (!modelo?.trim()) throw new Error("Modelo do veículo é obrigatório.");
        if (!cor?.trim()) throw new Error("Cor do veículo é obrigatória.");

        this.modelo = modelo.trim();
        this.cor = cor.trim();
        this.nickname = nickname ? nickname.trim() : null;
        this.imagem = imagem; // Assume URL ou DataURL
        this.ligado = Boolean(ligado);
        this.velocidade = Math.max(0, Number(velocidade) || 0);
        this.volume = Constants.DEFAULT_VOLUME;
        this.musica = null; // Objeto Audio
        this.musicaTocando = false;
        this.musicaNome = "Nenhuma música selecionada";
        this.fuelCapacity = Constants.FUEL_CAPACITY;
        this.fuelLevel = Math.max(0, Math.min(Number(fuelLevel) || Constants.DEFAULT_FUEL, this.fuelCapacity));

        // Processa histórico de manutenção, convertendo se necessário
        this.historicoManutencao = Array.isArray(historicoManutencao)
            ? historicoManutencao
                .map(item => item instanceof Manutencao ? item : Manutencao.fromPlainObject(item))
                .filter(Boolean) // Remove nulos se fromPlainObject falhar
                .sort((a, b) => b.getDataObj() - a.getDataObj()) // Ordena (mais recentes primeiro)
            : [];
    }

    /** Retorna apelido ou modelo para identificação. */
    getIdentifier() {
        return this.nickname || this.modelo;
    }

    // --- Métodos ---

    consumirCombustivel(quantidade) {
        if (this instanceof Bicicleta) return true; // Bicicletas não consomem
        if (this.fuelLevel <= 0) return false; // Já sem combustível

        const consumo = Math.max(0, quantidade); // Garante consumo não negativo

        if (this.fuelLevel < consumo) {
            console.warn(`${this.getIdentifier()}: ficou sem combustível durante o consumo.`);
            this.fuelLevel = 0;
            if (this.ligado) {
                // Chama desligar para tratamento completo (som, estado, etc.)
                this.desligar(); // Desligar já chama updateDisplay e salvarGaragem
                showNotification(`${this.getIdentifier()} desligado por falta de combustível!`, 'error');
            } else {
                this.updateDisplay(); // Apenas atualiza o display se já estava desligado
            }
            return false; // Falhou em consumir o solicitado
        }

        this.fuelLevel -= consumo;
        this.updateDisplay(); // Atualiza a UI com o novo nível
        return true; // Consumo bem-sucedido
    }

    reabastecer() {
        if (this instanceof Bicicleta) { showNotification("Bicicletas não usam combustível!", 'info'); return; }
        if (this.fuelLevel >= this.fuelCapacity) { showNotification(`${this.getIdentifier()} já está com tanque cheio.`, 'info'); return; }

        this.fuelLevel = this.fuelCapacity;
        showNotification(`${this.getIdentifier()} reabastecido com sucesso!`, 'success');
        this.updateDisplay(); // Atualiza UI
        salvarGaragem();    // Salva estado
    }

    ligar() {
        if (this instanceof Bicicleta) { showNotification("Bicicletas não ligam!", 'info'); return; }
        if (this.ligado) return; // Já ligado
        if (this.fuelLevel <= 0) { showNotification(`${this.getIdentifier()} sem combustível!`, 'warning'); return; }

        // Tenta consumir combustível inicial
        if (!this.consumirCombustivel(Constants.STARTUP_FUEL_COST)) {
            // Mensagem de erro já deve ter sido exibida por consumirCombustivel
            showNotification(`${this.getIdentifier()} não ligou (sem combustível suficiente).`, 'error');
            return;
        }

        playSound("ligar", this.volume);
        this.ligado = true;
        // showNotification(`${this.getIdentifier()} ligado!`, 'info'); // Opcional
        this.updateDisplay(); // Atualiza UI
        salvarGaragem();    // Salva estado
    }

    desligar() {
        if (this instanceof Bicicleta) { showNotification("Bicicletas não desligam!", 'info'); return; }
        // Impede desligar avião voando
        if (this instanceof Aviao && this.voando) { showNotification("Pouse o avião antes de desligar!", 'warning'); return; }
        if (!this.ligado) return; // Já desligado

        playSound("desligar", this.volume);
        this.pararMusica(); // Para a música ao desligar
        this.ligado = false;
        this.velocidade = 0; // Zera velocidade
        // Reseta estados específicos de subclasses
        if (this instanceof CarroEsportivo) this.turboAtivado = false;

        // showNotification(`${this.getIdentifier()} desligado.`, 'info'); // Opcional
        this.updateDisplay(); // Atualiza UI
        salvarGaragem();    // Salva estado
    }

    acelerar(incremento = 10) {
        const inc = Math.abs(Number(incremento)) || 10;

        // Lógica específica para Bicicleta
        if (this instanceof Bicicleta) {
            const velMaxBike = 40;
            if (this.velocidade >= velMaxBike) return; // Já no máximo
            this.velocidade = Math.min(velMaxBike, this.velocidade + inc / 2); // Acelera menos
            this.updateDisplay(); salvarGaragem(); return;
        }

        // Lógica para veículos motorizados
        if (!this.ligado) { showNotification("Ligue o veículo para acelerar.", 'warning'); return; }

        // Define custo de combustível e velocidade máxima padrão (Carro)
        let fuelCost = Constants.ACCEL_FUEL_COST;
        let velMax = 150;

        // Ajusta com base no tipo e estado
        if (this instanceof CarroEsportivo) {
            velMax = this.turboAtivado ? 300 : 200;
            if (this.turboAtivado) fuelCost *= Constants.TURBO_FUEL_COST_MULTIPLIER;
        } else if (this instanceof Caminhao) {
            velMax = 120;
            fuelCost *= Constants.TRUCK_FUEL_COST_MULTIPLIER;
        } else if (this instanceof Aviao) {
            velMax = this.voando ? 900 : 100; // Diferente em solo vs voo
            if (this.voando) fuelCost *= Constants.FLYING_FUEL_COST_MULTIPLIER;
             // Impede acelerar mais em solo se já atingiu limite de solo
            if (!this.voando && this.velocidade >= velMax) {
                 showNotification(`Velocidade máxima em solo (${velMax} km/h) atingida.`, 'info');
                 this.velocidade = velMax; // Garante que não passe
                 this.updateDisplay(); return;
             }
        }
         // else if (this instanceof Moto) { velMax = 180; } // Moto usa subclasse

        // Verifica e consome combustível ANTES de aumentar velocidade
        if (!this.consumirCombustivel(fuelCost)) {
            showNotification(`${this.getIdentifier()} sem combustível suficiente para acelerar!`, 'warning');
            return; // Consumir já tratou UI/save se necessário
        }

        // Verifica se já atingiu a velocidade máxima
        if (this.velocidade >= velMax) {
            if (this.velocidade > velMax) this.velocidade = velMax; // Corrige se passou
            this.updateDisplay(); // Atualiza mesmo se não mudou
            return; // Não acelera mais
        }

        // Acelera!
        playSound("acelerar", this.volume);
        this.velocidade = Math.min(velMax, this.velocidade + inc);
        this.updateDisplay(); // Atualiza UI
        salvarGaragem();    // Salva estado
    }

    frear(decremento = 10) {
        const dec = Math.abs(Number(decremento)) || 10;
        if (this.velocidade === 0) return; // Já parado

        // Impede frear avião no ar
        if (this instanceof Aviao && this.voando) {
            showNotification("Use controles de voo para reduzir velocidade aérea.", 'warning'); return;
        }

        // Toca som (exceto bike)
        if (!(this instanceof Bicicleta)) { playSound("frear", this.volume); }

        this.velocidade = Math.max(0, this.velocidade - dec); // Reduz até 0
        this.updateDisplay(); // Atualiza UI
        salvarGaragem();    // Salva estado
    }

    buzinar() {
        playSound(this instanceof Bicicleta ? "buzina_bike" : "buzina", this.volume);
    }

    setMusica(audioElement, nomeArquivo) {
        this.pararMusica(); // Para a anterior
        this.musica = audioElement;
        this.musicaNome = nomeArquivo || "Música carregada";
        if (this.musica instanceof Audio) {
            this.musica.loop = true;
            this.musica.volume = this.volume; // Aplica volume atual
        }
        // O nome será atualizado na UI pela chamada a updateDisplay
        // showNotification(`Música "${this.musicaNome}" carregada!`, 'info'); // Opcional
        this.updateDisplay(); // Garante que o nome da música seja exibido
        salvarGaragem();    // Salva o nome da música (não o objeto Audio)
    }

    tocarMusica() {
        if (this instanceof Bicicleta) { showNotification("Bicicletas não têm som.", 'info'); return; }
        if (this.musicaTocando) return; // Já tocando
        if (!(this.musica instanceof Audio)) { showNotification("Nenhuma música carregada.", 'warning'); return; }

        this.musica.volume = this.volume; // Garante volume correto
        this.musica.play()
            .then(() => { this.musicaTocando = true; /* Update UI indicator if needed */ })
            .catch(e => {
                this.musicaTocando = false; // Garante estado correto
                if (e.name === 'NotAllowedError') { showNotification("Interação do usuário necessária para tocar áudio.", 'warning'); }
                else { showNotification(`Erro ao tocar música: ${e.message}.`, 'error'); }
                console.error("Erro ao tocar música:", e);
            });
    }

    pararMusica() {
        if (!this.musicaTocando || !(this.musica instanceof Audio)) return;
        this.musica.pause();
        this.musica.currentTime = 0; // Volta para o início
        this.musicaTocando = false;
        /* Update UI indicator if needed */
    }

    adicionarManutencao(manutencaoObj) {
        if (!(manutencaoObj instanceof Manutencao)) {
            throw new Error("Objeto de manutenção inválido fornecido.");
        }
        this.historicoManutencao.push(manutencaoObj);
        // Reordena para manter mais recentes primeiro no array geral
        this.historicoManutencao.sort((a, b) => b.getDataObj() - a.getDataObj());

        salvarGaragem();        // Salva o estado
        updateManutencaoUI(this); // Atualiza a UI de manutenção (função externa)
        showNotification("Registro de manutenção adicionado!", 'success');
    }

    getHistoricoFormatado() {
        const historico = this.historicoManutencao
            .filter(m => m.isHistorico()) // Pega só os passados
            // .sort(...) // Não precisa ordenar aqui se o array já está ordenado desc
            .map(m => m.formatar()); // .formatar() já retorna <p>...
        return historico.length > 0 ? historico.join('') : "<p>Nenhum histórico registrado.</p>";
    }

    getAgendamentosFormatados() {
        const agendamentos = this.historicoManutencao
            .filter(m => m.isAgendamento()) // Pega só os futuros
            .sort((a, b) => a.getDataObj() - b.getDataObj()) // Ordena por data crescente
            .map(m => m.formatar()); // .formatar() já retorna <p>...
        return agendamentos.length > 0 ? agendamentos.join('') : "<p>Nenhum agendamento futuro.</p>";
    }

    /** Retorna informações básicas (modelo, cor, nickname). */
    /** @protected */
    exibirInformacoesBase() {
        const nick = this.nickname ? `"${this.nickname}" ` : '';
        // Sanitização básica
        const modeloSeguro = String(this.modelo).replace(/</g, "<").replace(/>/g, ">");
        const corSegura = String(this.cor).replace(/</g, "<").replace(/>/g, ">");
        const nickSeguro = nick.replace(/</g, "<").replace(/>/g, ">");
        return `${nickSeguro}Modelo: ${modeloSeguro}, Cor: ${corSegura}`;
    }

    /** Retorna informações completas (deve ser sobrescrito). */
    exibirInformacoes() {
        return this.exibirInformacoesBase();
    }

    /** Delega a atualização do DOM para a função externa. */
    /** @protected */
    updateDisplay() {
        updateDisplayContent(this);
    }

    /** Converte para objeto simples para serialização. */
    toPlainObject() {
        let plainData = {
            tipoVeiculo: this.constructor.name, // Essencial para recriar
            modelo: this.modelo,
            cor: this.cor,
            nickname: this.nickname,
            imagem: this.imagem,
            ligado: this.ligado,
            velocidade: this.velocidade,
            fuelLevel: this.fuelLevel,
            musicaNome: this.musicaNome,
            volume: this.volume,
            historicoManutencao: this.historicoManutencao.map(m => m.toPlainObject()),
        };

        // Adiciona/Remove propriedades específicas das subclasses
        if (this instanceof CarroEsportivo) plainData.turboAtivado = this.turboAtivado;
        if (this instanceof Caminhao) { plainData.capacidadeCarga = this.capacidadeCarga; plainData.cargaAtual = this.cargaAtual; }
        if (this instanceof Aviao) { plainData.envergadura = this.envergadura; plainData.altitude = this.altitude; plainData.voando = this.voando; }
        if (this instanceof Bicicleta) { plainData.tipo = this.tipo; delete plainData.fuelLevel; delete plainData.ligado; delete plainData.musicaNome; }

        return plainData;
    }
}