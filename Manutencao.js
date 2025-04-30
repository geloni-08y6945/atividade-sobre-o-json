// ======================================================
// Arquivo: js/Manutencao.js
// Descrição: Classe para representar registros de manutenção.
// ======================================================

/**
 * Representa um registro ou agendamento de manutenção.
 */
 class Manutencao {
    data; // Formato ISO String (UTC)
    tipo;
    custo;
    descricao;

    /**
     * Cria uma instância de Manutencao.
     * @param {string|Date} dataInput - Data ('YYYY-MM-DD' ou Date).
     * @param {string} tipo - Tipo do serviço.
     * @param {number|string} custo - Custo do serviço.
     * @param {string} [descricao=''] - Descrição opcional.
     */
    constructor(dataInput, tipo, custo, descricao = '') {
        if (!this._validarData(dataInput)) throw new Error("Data inválida para manutenção.");
        if (typeof tipo !== 'string' || !tipo.trim()) throw new Error("Tipo de serviço inválido.");
        const custoNum = parseFloat(custo);
        if (isNaN(custoNum) || custoNum < 0) throw new Error("Custo de manutenção inválido.");

        const dateObj = new Date(dataInput);
        // Re-valida após criar o objeto Date, pois strings inválidas podem não dar erro antes
        if (isNaN(dateObj.getTime())) throw new Error("Formato de data inválido.");
        dateObj.setUTCHours(0, 0, 0, 0); // Normaliza para UTC 00:00
        this.data = dateObj.toISOString();
        this.tipo = tipo.trim();
        this.custo = custoNum;
        this.descricao = descricao.trim();
    }

    /**
     * Valida internamente se a entrada pode ser interpretada como data válida.
     * @param {string|Date} dataInput - A data a ser validada.
     * @returns {boolean} True se válida, false caso contrário.
     * @private
     */
    _validarData(dataInput) {
        if (!dataInput || (typeof dataInput === 'string' && !dataInput.trim())) return false;
        // Tenta criar um objeto Date e verifica se é um número válido
        return !isNaN(new Date(dataInput).getTime());
    }

    /** Retorna a data como objeto Date (UTC). */
    getDataObj() { return new Date(this.data); }

    /** Verifica se é um agendamento (data >= hoje). */
    isAgendamento() {
        const hoje = new Date();
        hoje.setUTCHours(0, 0, 0, 0);
        return this.getDataObj() >= hoje;
    }

    /** Verifica se é histórico (data < hoje). */
    isHistorico() {
        const hoje = new Date();
        hoje.setUTCHours(0, 0, 0, 0);
        return this.getDataObj() < hoje;
    }

    /** Formata para exibição em HTML (dentro de um <p>). */
    formatar() {
        const dataFormatada = this.getDataObj().toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
        const custoFormatado = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        // Sanitização básica para evitar injeção de HTML na descrição
        const descSanitized = this.descricao.replace(/</g, "<").replace(/>/g, ">");
        let baseHtml = `<span class="tipo-servico">${this.tipo}</span> em ${dataFormatada} <span class="custo-servico">${custoFormatado}</span>`;
        if (this.descricao) {
            baseHtml += ` - Descrição: ${descSanitized}`;
        }
        return `<p>${baseHtml}</p>`; // Retorna o conteúdo já dentro de um parágrafo
    }

    /** Converte para objeto simples para serialização. */
    toPlainObject() {
        return { data: this.data, tipo: this.tipo, custo: this.custo, descricao: this.descricao };
    }

    /** Cria instância a partir de objeto simples (desserialização). */
    static fromPlainObject(obj) {
        // Verifica se as propriedades essenciais existem
        if (!obj?.data || !obj?.tipo || obj.custo === undefined) {
            console.error("Dados de Manutenção inválidos recebidos:", obj);
            return null;
        }
        try {
            // Usa o construtor para validação e criação
            return new Manutencao(obj.data, obj.tipo, obj.custo, obj.descricao || '');
        }
        catch (e) {
            console.error("Erro ao recriar Manutencao:", obj, e);
            return null;
        }
    }
}