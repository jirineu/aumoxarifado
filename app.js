// ==========================================
// 1. CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ==========================================
const urlWebApp = "https://script.google.com/macros/s/AKfycbw36Zv_IdusCQWqMsqswymxSNQ5NjDULUQ_KebVRonzRTPR7Z6rDTtXqwfRodRc6guMPg/exec";
let timeoutLogin = null;
let timeoutSalvar = null;

// ==========================================
// 2. STORAGE / BANCO DE DADOS LOCAL
// ==========================================
let historico = JSON.parse(localStorage.getItem("historico")) || [];
let funcionarios = JSON.parse(localStorage.getItem("funcionarios")) || [];
let pontos = JSON.parse(localStorage.getItem("pontos")) || [];
let armarios = JSON.parse(localStorage.getItem("armarios")) || [];
let relatorioRefeicoes = JSON.parse(localStorage.getItem("relatorioRefeicoes")) || [];

let idFuncionarioEditando = null; // Guarda o ID se for edição, ou null se for cadastro novo
document.addEventListener("DOMContentLoaded", () => {
    const logado = localStorage.getItem("loginFeito");
    
    if (logado === "true") {
        console.log("Sessão encontrada! Pulando tela de login...");
        
        // 1. Esconde a tela de login
        const abaLogin = document.getElementById("aba-login");
        if (abaLogin) {
            abaLogin.classList.remove("ativa");
            abaLogin.style.display = "none";
        }

        // 2. Mostra a tela de estoque
        const abaEstoque = document.getElementById("aba-estoque");
        if (abaEstoque) {
            abaEstoque.classList.add("ativa");
            abaEstoque.style.display = "block";
        }

        // 3. Mostra o menu de navegação inferior
        const menu = document.querySelector(".menu");
        if (menu) {
            menu.style.display = "flex";
        }

        // Carrega dados iniciais da planilha se a função existir
        if (typeof atualizarDadosDaPlanilha === "function") {
            atualizarDadosDaPlanilha();
        }
    }
});
// ==========================================
// 3. CRIAR ARMÁRIOS (INICIALIZAÇÃO)
// ==========================================
if (armarios.length === 0) {
    for (let i = 1; i <= 60; i++) {
        armarios.push({
            numero: i,
            funcionario: null
        });
    }
    salvarTudo();
}

// ==========================================
// SEU CÓDIGO CONTINUA ABAIXO (função salvarTudo, executarLogin, etc...)
// ==========================================
async function salvarTudo(){

    // =================================
    // SALVAR LOCAL
    // =================================

    localStorage.setItem(
        "historico",
        JSON.stringify(historico)
    );

    localStorage.setItem(
        "funcionarios",
        JSON.stringify(funcionarios)
    );

    localStorage.setItem(
        "pontos",
        JSON.stringify(pontos)
    );

    localStorage.setItem(
        "armarios",
        JSON.stringify(armarios)
    );
let relatorioRefeicoes = 
JSON.parse(localStorage.getItem("relatorioRefeicoes")) || [];
    // =================================
    // EVITA MUITAS REQUISIÇÕES
    // =================================

    clearTimeout(timeoutSalvar);

    timeoutSalvar = setTimeout(async () => {

        try{

            await fetch(

                "https://script.google.com/macros/s/AKfycbw36Zv_IdusCQWqMsqswymxSNQ5NjDULUQ_KebVRonzRTPR7Z6rDTtXqwfRodRc6guMPg/exec",

                {

                    method:"POST",

                    mode:"no-cors",

                    headers:{
                        "Content-Type":"application/json"
                    },

                    body:JSON.stringify({

                        historico,
                        funcionarios,
                        pontos,
                        armarios,
                        relatorioRefeicoes

                    })

                }

            );

            console.log(
                "Dados enviados para planilha"
            );
            
            // ==========================================================
            // CORREÇÃO AQUI: Atualiza as tabelas assim que o envio termina!
            // ==========================================================
            renderHistoricoPontos();
            renderFuncionarios();

        }catch(erro){

            console.log(
                "Erro ao salvar:",
                erro
            );

        }

    }, 2000);

}



// ===========================
// ABAS
// ===========================

function abrirAba(nome){

    document
    .querySelectorAll(".aba")
    .forEach(aba => {
        aba.classList.remove("ativa");
    });

    document
    .getElementById(`aba-${nome}`)
    .classList.add("ativa");

}

// ===========================
// ESTOQUE
// ===========================

function registrarSaida(){

    const material =
    document.getElementById("material").value;

    const quantidade =
    document.getElementById("quantidade").value;

    const funcionario =
    document.getElementById("funcionario").value;

    if(
        !material ||
        !quantidade ||
        !funcionario
    ){
        return alert("Preencha tudo");
    }

    historico.unshift({

        id: Date.now(),

        material,
        quantidade,
        funcionario,

        data:new Date().toLocaleString(),

        status:"pendente",

        motivo:""

    });

    salvarTudo();

    // LIMPAR CAMPOS

    document.getElementById("material").value = "";
    document.getElementById("quantidade").value = "";
    document.getElementById("funcionario").value = "";

    renderHistorico();

}
function renderHistorico(){

    const div =
    document.getElementById("historico");

    div.innerHTML = "";

    // ==========================================
    // FUNÇÃO INTERNA PARA LIMPAR A DATA DO ESTOQUE
    // ==========================================
    const extrairDataEstoqueLimpa = (valorData) => {
        if (!valorData) return "";
        let texto = String(valorData).trim();

        // 1. Se for uma data longa por extenso (ex: "Wed Jun 03 2026 13:25:00 GMT..."),
        // tenta converter e isolar de forma legível
        if (texto.length > 15 && texto.includes("GMT")) {
            try {
                const dataObj = new Date(texto);
                if (!isNaN(dataObj.getTime())) {
                    const dataBR = dataObj.toLocaleDateString("pt-BR");
                    const horaBR = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                    return `${dataBR} às ${horaBR}`;
                }
            } catch (e) {}
        }

        // 2. Se for formato ISO / JSON (ex: "2026-06-03T13:25:00.000Z")
        if (texto.includes("T") && texto.includes("-")) {
            try {
                const dataObj = new Date(texto);
                if (!isNaN(dataObj.getTime())) {
                    const dataBR = dataObj.toLocaleDateString("pt-BR");
                    const horaBR = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                    return `${dataBR} às ${horaBR}`;
                }
            } catch (e) {}
        }

        return texto;
    };

    historico.forEach(item => {

        // CORRIGE ITENS ANTIGOS

        if(!item.id){

            item.id = Date.now() + Math.random();

        }

        if(!item.status){

            item.status = "pendente";

        }

        if(!item.motivo){

            item.motivo = "";

        }

        // Limpa a data e hora do item do histórico antes de exibir
        const dataExibicao = extrairDataEstoqueLimpa(item.data);

        div.innerHTML += `

        <div class="historico-item">

            <strong>${item.material}</strong>

            <p>Qtd: ${item.quantidade}</p>

            <p>${item.funcionario}</p>

            <p>${dataExibicao}</p>

            ${
                item.status === "pendente"

                ?

                `

                <div class="botoes">

                    <button
                        class="btn-ponto"
                        onclick="marcarDevolvido('${item.id}')"
                    >
                        ✔
                    </button>

                    <button
                        class="btn-x"
                        onclick="abrirExtravio('${item.id}')"
                    >
                        ✖
                    </button>

                </div>

                `

                :

                item.status === "devolvido"

                ?

                `

                <div class="status-devolvido">
                    ✔ Item usado/devolvido
                </div>

                `

                :

                `

                <div class="status-extraviado">
                    ✖ Item extraviado
                </div>

                <div class="motivo">
                    <strong>Motivo:</strong>
                    ${item.motivo}
                </div>

                `
            }

        </div>

        `;

    });

}

// ===========================
// FUNCIONÁRIOS
// ===========================

function salvarFuncionario(){

    const nome =
    document.getElementById("nomeFuncionario").value;

    const funcao =
    document.getElementById("funcaoFuncionario").value;

    // CAPTURA OS NOVOS CAMPOS DO FORMULÁRIO
    const entrada =
    document.getElementById("entradaFuncionario").value;

    const saida =
    document.getElementById("saidaFuncionario").value;

    const alojamento =
    document.getElementById("alojamentoFuncionario").value;

    const vr =
    document.getElementById("vrFuncionario").value;

    // VALIDAÇÃO: Garante que todos os campos obrigatórios estejam preenchidos
    if(!nome || !funcao || !entrada || !saida){
        mostrarToast("Por favor, preencha todos os campos do funcionário.");
        return;
    }

    // VERIFICA SE ESTÁ EDITANDO OU CRIANDO UM NOVO
    if (idFuncionarioEditando !== null) {
        // Localiza o funcionário existente pelo ID guardado no controle de edição
        const funcionario = funcionarios.find(f => f.id === idFuncionarioEditando);
        
        if (funcionario) {
            funcionario.nome = nome;
            funcionario.funcao = funcao;
            funcionario.entrada = Number(entrada);
            funcionario.saida = Number(saida);
            funcionario.alojamento = alojamento;
            funcionario.vr = vr;
            
            mostrarToast("Funcionário atualizado com sucesso!");
        }
        // Reseta o controle de edição para os próximos cliques voltarem a ser novos cadastros
        idFuncionarioEditando = null;
    } else {
        // ADICIONA O NOVO FUNCIONÁRIO AO ARRAY COM TODAS AS NOVAS VARIÁVEIS
        funcionarios.push({
            id: Date.now(),
            nome,
            funcao,
            entrada: Number(entrada), // Salva como número inteiro puro (ex: 8)
            saida: Number(saida),     // Salva como número inteiro puro (ex: 17)
            alojamento,               // "Sim" ou "Não"
            vr                        // "Sim" ou "Não"
        });

        mostrarToast("Funcionário cadastrado com sucesso!");
    }

    // Salva tudo localmente e envia para a planilha
    salvarTudo();

    // Atualiza a interface visual
    renderFuncionarios();

    // LIMPA OS CAMPOS DO FORMULÁRIO APÓS SALVAR
    document.getElementById("nomeFuncionario").value = "";
    document.getElementById("funcaoFuncionario").value = "";
    document.getElementById("entradaFuncionario").value = "";
    document.getElementById("saidaFuncionario").value = "";
    document.getElementById("alojamentoFuncionario").value = "Não";
    document.getElementById("vrFuncionario").value = "Não";

    // Restaura o texto padrão do botão caso ele tenha sido alterado pela função editar
    const botaoSalvar = document.querySelector("button[onclick='salvarFuncionario()']");
    if (botaoSalvar) {
        botaoSalvar.textContent = "Salvar Funcionário";
    }
}

function renderFuncionarios(lista = funcionarios){

    const div =
    document.getElementById("listaFuncionarios");

    div.innerHTML = "";

    const hoje = new Date().toLocaleDateString("pt-BR");
    const agoraTimestamp = new Date().getTime();
    const tresHorasEmMs = 3 * 60 * 60 * 1000; // 3 horas em milissegundos

    lista.forEach(funcionario => {

        // Busca o registro de ponto do funcionário para o dia de hoje
        const registro = pontos.find(p => p.funcionarioId === funcionario.id && p.data === hoje);

        let classeStatus = "vermelho"; // Padrão: Não bateu o ponto ainda

        if (registro) {
            if (registro.saida) {
                // 4ª Batida realizada: Saída Final
                classeStatus = "azul";
            } 
            else if (registro.almocoRetorno) {
                // 3ª Batida realizada: Volta do Almoço
                classeStatus = "laranja";
            } 
            else if (registro.almocoSaida) {
                // 2ª Batida realizada: Saída para Almoço
                classeStatus = "verde";
            } 
            else if (registro.entrada) {
                // 1ª Batida realizada: Entrada do dia
                // Verifica se já se passaram mais de 3 horas desde a entrada
                const tempoDecorrido = agoraTimestamp - (registro.timestampEntrada || agoraTimestamp);
                
                if (tempoDecorrido > tresHorasEmMs) {
                    classeStatus = "laranja"; // Passou de 3 horas
                } else {
                    classeStatus = "verde"; // Menos de 3 horas
                }
            }
        }

        // Garante a exibição correta dos horários do contrato
        const entradaExibicao = (funcionario.entrada !== undefined && funcionario.entrada !== null) ? funcionario.entrada : "--";
        const saidaExibicao = (funcionario.saida !== undefined && funcionario.saida !== null) ? funcionario.saida : "--";

        div.innerHTML += `

        <div class="funcionario ${classeStatus}">

            <strong>${funcionario.nome}</strong>

            <p>Função: ${funcionario.funcao}</p>

            <p>Horário: ${entradaExibicao}h às ${saidaExibicao}h</p>

            <div class="botoes">

                <button
                    class="btn-editar"
                    onclick="editarFuncionario(${funcionario.id})"
                >
                    Editar
                </button>

                <button
                    class="btn-ponto"
                    onclick="baterPonto(${funcionario.id})"
                >
                    Bater Ponto
                </button>

            </div>

        </div>

        `;

    });

}
function editarFuncionario(id){
    const funcionario = funcionarios.find(f => f.id === id);
    if(!funcionario) return;

    // Guarda o ID do funcionário que estamos editando
    idFuncionarioEditando = id;

    // Preenche os campos do formulário de criação com os dados atuais dele
    document.getElementById("nomeFuncionario").value = funcionario.nome;
    document.getElementById("funcaoFuncionario").value = funcionario.funcao;
    document.getElementById("entradaFuncionario").value = funcionario.entrada || "";
    document.getElementById("saidaFuncionario").value = funcionario.saida || "";
    document.getElementById("alojamentoFuncionario").value = funcionario.alojamento || "Não";
    document.getElementById("vrFuncionario").value = funcionario.vr || "Não";

    // Altera o texto do botão de salvar para dar um feedback visual
    const botaoSalvar = document.querySelector("button[onclick='salvarFuncionario()']");
    if(botaoSalvar) {
        botaoSalvar.textContent = "Atualizar Dados";
    }

    // Alerta discreto avisando que os dados subiram para o formulário
    mostrarToast("Dados carregados no formulário acima!");
    
    // Opcional: Rola a tela suavemente para o topo onde está o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================================================
// FUNÇÃO JAVASCRIPT: CONTA OS ITENS COM BASE NO JSON LOCAL
// =========================================================================
// =========================================================================
// FUNÇÃO AJUSTADA: ATUALIZAR CONTADOR LOCAL NO HTML
// =========================================================================
function atualizarContadorLocal() {
    // 1. Tenta pegar da variável global. Se não for um array ou estiver vazia, busca no LocalStorage
    let listaParaContar = (typeof funcionarios !== 'undefined' && Array.isArray(funcionarios)) ? funcionarios : [];
    
    if (listaParaContar.length === 0) {
        listaParaContar = JSON.parse(localStorage.getItem("funcionarios")) || [];
    }

    // 2. Localiza o elemento exato do HTML
    const campoIndicador = document.getElementById("qtdAtivosPlanilha");
    
    if (campoIndicador) {
        // 3. Injeta a quantidade de funcionários cadastrados na tela
        campoIndicador.textContent = listaParaContar.length;
    }
}

// ===========================
// BATER PONTO
// ===========================
function mostrarToast(mensagem) {
    // Cria o elemento do toast
    const toast = document.createElement("div");
    toast.textContent = message = mensagem;
    
    // Aplica o estilo do Toast diretamente para ficar no topo e disfarçado
    Object.assign(toast.style, {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#333",
        color: "#fff",
        padding: "12px 24px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: "10000",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        transition: "opacity 0.3s ease",
        opacity: "0",
        textAlign: "center",
        pointerEvents: "none"
    });

    document.body.appendChild(toast);

    // Faz o efeito de aparecer (fade-in)
    setTimeout(() => { toast.style.opacity = "1"; }, 50);

    // Some e remove do mapa após 3 segundos
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => { toast.remove(); }, 300);
    }, 3000);
}
// ======================================
// BATER PONTO (LOGICA DE 4 BATIDAS E CORES)
// ======================================
function baterPonto(id) {
    const hoje = new Date().toLocaleDateString("pt-BR");
    const agora = new Date();
    const horario = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });

    let registro = pontos.find(p => p.funcionarioId === id && p.data === hoje);

    // Se ainda não existe registro hoje, cria a PRIMEIRA BATIDA (Entrada)
    if (!registro) {
        pontos.unshift({
            funcionarioId: id,
            data: hoje,
            entrada: horario,
            almocoSaida: "",
            almocoRetorno: "",
            saida: "",
            timestampEntrada: agora.getTime(),
            timestampRetorno: 0
        });
        mostrarToast("Entrada registrada com sucesso!");
    } 
    // SEGUNDA BATIDA: Saída para o Almoço
    else if (!registro.almocoSaida) {
        registro.almocoSaida = horario;
        mostrarToast("Saída para o almoço registrada!");
    } 
    // TERCEIRA BATIDA: Volta do Almoço
    else if (!registro.almocoRetorno) {
        registro.almocoRetorno = horario;
        registro.timestampRetorno = agora.getTime(); // Guarda o momento exato da volta do almoço
        mostrarToast("Retorno do almoço registrado!");
    } 
    // QUARTA BATIDA: Saída do Expediente
    else if (!registro.saida) {
        registro.saida = horario;
        mostrarToast("Saída do expediente registrada! Ponto finalizado.");
    } 
    else {
        return mostrarToast("Todos os 4 pontos deste funcionário já foram batidos hoje.");
    }

    // Salva localmente e envia para a planilha de fundo (aciona o fetch em background)
    salvarTudo();
    
    // Atualiza a interface visual das listas no front-end
    renderFuncionarios();
    renderHistoricoPontos();
}

// ===========================
// HISTÓRICO PONTO
// ===========================

function renderHistoricoPontos(){

    const div =
    document.getElementById("historicoPontos");

    div.innerHTML = "";

    // ==========================================================
    // FILTRO DIÁRIO TRAVADO: Pega estritamente a data de hoje (DD/MM/AAAA)
    // ==========================================================
    const dataHojeBR = new Date().toLocaleDateString("pt-BR");

    // ==========================================
    // TRATAMENTO EXCLUSIVO PARA ENTRADA E SAÍDA
    // ==========================================
    const extrairApenasHora = (valor) => {
        if (!valor) return "--";
        
        let texto = String(valor).trim();

        if (texto.length > 15) {
            const matchHoraCompleta = texto.match(/\b\d{2}:\d{2}:\d{2}\b/);
            if (matchHoraCompleta && matchHoraCompleta[0] !== "00:00:00") {
                return matchHoraCompleta[0].substring(0, 5);
            }
        }

        const matchSimples = texto.match(/\d{2}:\d{2}/);
        if (matchSimples) {
            return matchSimples[0];
        }

        return texto;
    };

    // ==========================================
    // TRATAMENTO EXCLUSIVO PARA O CAMPO DA DATA
    // ==========================================
    const extrairApenasData = (valorData) => {
        if (!valorData) return "";
        let texto = String(valorData).trim();

        if (texto.length > 15 && texto.includes("GMT")) {
            try {
                const dataObj = new Date(texto);
                if (!isNaN(dataObj.getTime())) {
                    return dataObj.toLocaleDateString("pt-BR");
                }
            } catch (e) {}
        }
        
        if (texto.includes("-") && texto.length <= 10) {
            const partes = texto.split("-");
            if (partes.length === 3 && partes[0].length === 4) {
                return `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
        }

        return texto;
    };

    pontos.forEach(ponto => {

        const dataPontoFormatada = extrairApenasData(ponto.data);

        // TRAVA O FILTRO: Se o ponto não for de hoje, ele ignora e pula para o próximo
        if (dataPontoFormatada !== dataHojeBR) {
            return;
        }

        const funcionario =
        funcionarios.find(f =>
            f.id === ponto.funcionarioId
        );

        if(!funcionario) return;

        // Limpa e formata as 4 batidas capturadas do objeto do ponto
        const entradaLimpa = extrairApenasHora(ponto.entrada);
        const almocoSaidaLimpa = extrairApenasHora(ponto.almocoSaida);
        const almocoRetornoLimpa = extrairApenasHora(ponto.almocoRetorno);
        const saidaLimpa = extrairApenasHora(ponto.saida);
        const dataExibicao = dataPontoFormatada;

        div.innerHTML += `

        <div class="historico-item">

            <strong>${funcionario.nome}</strong>

            <p>Função: ${funcionario.funcao}</p>

            <p>Entrada: ${entradaLimpa}</p>
            <p>Saída Almoço: ${almocoSaidaLimpa}</p>
            <p>Volta Almoço: ${almocoRetornoLimpa}</p>
            <p>Saída Final: ${saidaLimpa}</p>

            <small style="display: block; margin-top: 5px; color: #666;">
                Data: ${dataExibicao}
            </small>

        </div>

        `;

    });

}

// ===========================
// FILTRO FUNCIONÁRIOS
// ===========================

function filtrarFuncionarios(){

    const valor =
    document
    .getElementById("filtroFuncionario")
    .value
    .toLowerCase();

    const filtrados =
    funcionarios.filter(f =>

        f.nome.toLowerCase().includes(valor)
        ||

        f.funcao.toLowerCase().includes(valor)

    );

    renderFuncionarios(filtrados);

}

// ===========================
// ARMÁRIOS
// ===========================

let armarioAtual = null;

// ======================================
// ABA ARMÁRIOS - CONTROLE DE INTERFACE (FRONT-END)
// ======================================

/**
 * 1. RENDERIZA A GRADE DE ARMÁRIOS na tela
 */
function renderArmarios() {
    const div = document.getElementById("gradeArmarios");
    if (!div) return;

    // Monta o HTML em memória para melhor performance e evitar travamentos
    const htmlArmarios = armarios.map(armario => {
        const classeStatus = armario.funcionario ? 'ocupado' : 'livre';
        return `
            <div class="armario ${classeStatus}" onclick="abrirArmario(${armario.numero})">
                ${armario.numero}
            </div>
        `;
    });

    div.innerHTML = htmlArmarios.join("");
}

/**
 * 2. ABRE O POPUP do armário selecionado
 */
function abrirArmario(numero) {
    armarioAtual = numero;
    const armario = armarios.find(a => a.numero === numero);
    if (!armario) return;

    // Exibe o popup
    document.getElementById("popupArmario").style.display = "flex";

    // Define a mensagem interna com base na ocupação
    document.getElementById("infoArmario").innerHTML = armario.funcionario
        ? `Pertence a <strong>${armario.funcionario}</strong>`
        : `Armário vazio`;

    // Alimenta o select com a lista de funcionários ativos
    const select = document.getElementById("selectFuncionario");
    if (select) {
        select.innerHTML = funcionarios.map(f => `
            <option value="${f.nome}">${f.nome}</option>
        `).join("");
    }
}

/**
 * 3. VINCULA O FUNCIONÁRIO AO ARMÁRIO (Botão Salvar)
 */
function vincularArmario() {
    const select = document.getElementById("selectFuncionario");
    if (!select) return;

    const funcionario = select.value;
    const armario = armarios.find(a => a.numero === armarioAtual);

    if (armario) {
        armario.funcionario = funcionario;

        // Dispara o ciclo de sincronização unificado
        salvarTudo(); 
        fecharPopup();
        renderArmarios();
    }
}

/**
 * 4. FECHA O POPUP da tela
 */
function fecharPopup() {
    const popup = document.getElementById("popupArmario");
    if (popup) popup.style.display = "none";
}

let idExtravio = null;

function marcarDevolvido(id){

    const item =
    historico.find(h => String(h.id) === String(id));

    if(!item){

        return alert("Item não encontrado");

    }

    item.status = "devolvido";

    salvarTudo();

    renderHistorico();

}

function abrirExtravio(id){

    idExtravio = id;

    document
    .getElementById("popupExtravio")
    .style.display = "flex";

}

function confirmarExtravio(){

    const motivo =
    document
    .getElementById("motivoExtravio")
    .value;

    if(!motivo){

        return alert("Digite o motivo");

    }

    const item =
    historico.find(
        h => String(h.id) === String(idExtravio)
    );

    if(!item){

        return alert("Item não encontrado");

    }

    item.status = "extraviado";

    item.motivo = motivo;

    salvarTudo();

    document
    .getElementById("popupExtravio")
    .style.display = "none";

    document
    .getElementById("motivoExtravio")
    .value = "";

    renderHistorico();

}

// ======================================
// BUSCAR DADOS DA PLANILHA E ATUALIZAR LOCALSTORAGE
// ======================================
async function atualizarDadosDaPlanilha() {
    // Seleciona o botão de atualizar para dar um feedback visual ao usuário
    const botao = document.querySelector("button[onclick='atualizarDadosDaPlanilha()']");
    const textoOriginal = botao.innerHTML;
    
    try {
        // Efeito visual de carregando
        botao.innerHTML = "⌛";
        botao.disabled = true;

        // URL gerada na implantação do seu Google Apps Script
        const urlWebApp = "https://script.google.com/macros/s/AKfycbw36Zv_IdusCQWqMsqswymxSNQ5NjDULUQ_KebVRonzRTPR7Z6rDTtXqwfRodRc6guMPg/exec"; 
        
        const resposta = await fetch(urlWebApp);
        const dados = await resposta.json();
        
        if (dados.sucesso) {
            // CORREÇÃO DE SEGURANÇA: Cancela qualquer edição ativa se os dados forem atualizados no meio do processo
            idFuncionarioEditando = null;
            const botaoSalvar = document.querySelector("button[onclick='salvarFuncionario()']");
            if (botaoSalvar) { botaoSalvar.textContent = "Salvar Funcionário"; }

            // 1. Atualiza as variáveis na memória RAM do sistema
            funcionarios = dados.funcionarios || [];
            historico = dados.historico || [];
            pontos = dados.pontos || [];
            armarios = dados.armarios || [];
            
            // ==========================================================
            // SALVAMENTO FORÇADO: Deleta o lixo antigo do LocalStorage primeiro
            // ==========================================================
            localStorage.removeItem("funcionarios");
            localStorage.removeItem("historico");
            localStorage.removeItem("pontos");
            localStorage.removeItem("armarios");

            // 2. Grava os dados novos e limpos da planilha com os inteiros puros
            localStorage.setItem("funcionarios", JSON.stringify(funcionarios));
            localStorage.setItem("historico", JSON.stringify(historico));
            localStorage.setItem("pontos", JSON.stringify(pontos));
            localStorage.setItem("armarios", JSON.stringify(armarios));
            
            // 3. Renderiza novamente os componentes da tela com a nova memória limpa
            renderFuncionarios();       // Mostrará os inteiros corretos agora
            renderHistorico();
            renderHistoricoPontos();    
            renderArmarios();
            
            // Limpa o campo de busca de funcionário se ele existir, para mostrar a lista completa atualizada
            const filtro = document.getElementById("filtroFuncionario");
            if (filtro) { filtro.value = ""; }

            // Usa o seu Toast no topo da tela
            mostrarToast("Dados atualizados e limpos com sucesso!");
        } else {
            // Usa o seu Toast no topo da tela em caso de erro da resposta
            mostrarToast("Erro ao sincronizar: " + dados.erro);
        }

    } catch (erro) {
        console.error("Erro na requisição GET:", erro);
        // Usa o seu Toast no topo da tela em caso de falha de conexão
        mostrarToast("Não foi possível buscar os dados. Verifique sua conexão.");
    } finally {
        // Restaura o botão ao estado original
        botao.innerHTML = textoOriginal;
        botao.disabled = false;
    }
}

// ===========================
// ABA FOOD
// ===========================
// Variável global para gerenciar a lista em memória
let listaFoodAtual = [];

/**
 * 1. CONTROLE DE NAVEGAÇÃO
 * Garante a abertura da aba correspondente e esconde as demais
 */
function abrirAba(nomeAba) {
    // Localiza todas as seções possíveis do app pelas classes e IDs padrão
    const todasAsAbas = document.querySelectorAll('.aba, .secao-aba, [id^="aba-"]');
    todasAsAbas.forEach(aba => {
        aba.style.display = 'none';
    });

    // Ativa a aba selecionada
    const abaAlvo = document.getElementById('aba-' + nomeAba);
    if (abaAlvo) {
        abaAlvo.style.display = 'block';
        
        // Se abrir a aba food, redesenha o estado atual da lista na tela
        if (nomeAba === 'food') {
            renderListaFood();
        }
    } else {
        console.error("Aba não encontrada: aba-" + nomeAba);
    }
}

/**
 * 2. PROCESSAMENTO E FILTRAGEM (Botão Gerar Lista)
 * Filtra os funcionários baseando-se nas regras de VR e ponto de Entrada do dia
 */


/**
 * 3. RENDERIZAÇÃO DA TELA E CONTADOR
 * Constrói o HTML interno com os botões de exclusão e soma o totalizador
 */
function renderListaFood() {
    const divConteudo = document.getElementById("conteudoListaFood");
    const divSoma = document.getElementById("resultadoSomaFood");
    const spanTotal = document.getElementById("totalRefeicoes");

    if (!divConteudo) return;

    // Reseta o container antes de desenhar
    divConteudo.innerHTML = "";

    // Se a lista estiver vazia (ou antes de gerar)
    if (listaFoodAtual.length === 0) {
        divConteudo.innerHTML = `<p class="food-vazio">Nenhum funcionário na lista de hoje.</p>`;
        if (divSoma) divSoma.style.display = "none";
        return;
    }

    // Alimenta a lista gerando a estrutura com as classes CSS corretas
    listaFoodAtual.forEach((funcionario, index) => {
        divConteudo.innerHTML += `
            <div class="food-item">
                <div class="food-info">
                    <strong>${funcionario.nome}</strong>
                    <span>ID: ${funcionario.id} | ${funcionario.funcao}</span>
                </div>
                <button class="btn-excluir-food" onclick="removerDaListaFood(${index})">❌ Excluir</button>
            </div>
        `;
    });

    // Atualiza o painel do somatório totalizador
    if (divSoma && spanTotal) {
        spanTotal.textContent = listaFoodAtual.length;
        divSoma.style.display = "block";
    }
    
}

/**
 * 4. EXCLUSÃO INDIVIDUAL (Botão Excluir)
 * Remove o funcionário da lista temporária do dia sem afetar o banco principal
 */
function removerDaListaFood(index) {
    if (index >= 0 && index < listaFoodAtual.length) {
        // Remove do array pelo índice
        listaFoodAtual.splice(index, 1);
        // Atualiza a tela e o contador imediatamente
        renderListaFood();
    }
}

/**
 * FUNÇÃO DO BOTÃO "GERAR LISTA" (No app.js)
 * Filtra os funcionários, atualiza a tela e adiciona o relatório no pacote de salvamento.
 */
function gerarListaFood() {
    const agora = new Date();
    const hoje = agora.toLocaleDateString("pt-BR");
    const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    
    if (!funcionarios || !pontos) {
        console.error("Dados de funcionários ou pontos não carregados.");
        return;
    }

    // 1. Filtra quem NÃO tem VR marcado como "Sim"
    const semVR = funcionarios.filter(f => !f.vr || String(f.vr).trim().toLowerCase() !== "sim");

    // 2. Mantém apenas quem registrou a entrada hoje
    listaFoodAtual = semVR.filter(f => {
        const bateuHoje = pontos.find(p => Number(p.funcionarioId) === Number(f.id) && p.data === hoje);
        return bateuHoje && bateuHoje.entrada;
    });

    // 3. Desenha a lista atualizada na tela do usuário
    renderListaFood();

    // 4. Cria o objeto do relatório com Data, Hora e Total
    const novoRegistroRefeicao = {
        data: hoje,
        hora: hora,
        total: listaFoodAtual.length
    };

    // 5. Adiciona ao seu array global de relatórios (garanta que essa variável exista no topo do app.js)
    if (typeof relatorioRefeicoes === 'undefined') {
        window.relatorioRefeicoes = []; 
    }
    
    // Evita duplicar vários relatórios idênticos no mesmo minuto se clicarem várias vezes
    const jaExiste = relatorioRefeicoes.find(r => r.data === hoje && r.hora === hora);
    if (!jaExiste) {
        relatorioRefeicoes.push(novoRegistroRefeicao);
        
        // Salva localmente no localStorage do relatório também, se desejar
        localStorage.setItem("relatorioRefeicoes", JSON.stringify(relatorioRefeicoes));
    }

    // =====================================================================
    // ATENÇÃO: Modifique o corpo do seu 'salvarTudo()' para incluir o 'relatorioRefeicoes'
    // =====================================================================
    salvarTudo(); 
}
// ==========================================
// FUNÇÃO DE LOGIN DO SISTEMA
// ==========================================
async function executarLogin() {
    const usuario = document.getElementById("login-usuario").value.trim();
    const senha = document.getElementById("login-senha").value.trim();
    const msgErro = document.getElementById("mensagem-erro");

    if (!usuario || !senha) {
        msgErro.innerText = "Por favor, preencha todos os campos.";
        msgErro.style.display = "block";
        return; 
    }

    msgErro.style.display = "none";

    // Evita múltiplos cliques seguidos no botão
    clearTimeout(timeoutLogin);

    timeoutLogin = setTimeout(async () => {
        try {
            const urlComParametros = `${urlWebApp}?acao=login&usuario=${encodeURIComponent(usuario)}&senha=${encodeURIComponent(senha)}`;

            const resposta = await fetch(urlComParametros);
            const resultado = await resposta.json();

            if (resultado.sucesso === true) {
                console.log("Login autorizado com sucesso!");

                // SALVA O ESTADO DO LOGIN NO LOCALSTORAGE para não pedir novamente
                localStorage.setItem("loginFeito", "true");

                // 1. Esconde a tela de login
                const abaLogin = document.getElementById("aba-login");
                if (abaLogin) {
                    abaLogin.classList.remove("ativa");
                    abaLogin.style.display = "none";
                }

                // 2. Mostra a tela de estoque
                const abaEstoque = document.getElementById("aba-estoque");
                if (abaEstoque) {
                    abaEstoque.classList.add("ativa");
                    abaEstoque.style.display = "block";
                }

                // 3. Mostra o menu de navegação inferior
                const menu = document.querySelector(".menu");
                if (menu) {
                    menu.style.display = "flex";
                }

                // Tenta carregar os dados se a função existir
                if (typeof atualizarDadosDaPlanilha === "function") {
                    atualizarDadosDaPlanilha();
                }

            } else {
                msgErro.innerText = "Usuário ou senha incorretos.";
                msgErro.style.display = "block";
            }

        } catch (erro) {
            console.log("Erro ao validar credenciais:", erro);
            msgErro.innerText = "Falha na conexão com o servidor.";
            msgErro.style.display = "block";
        }
    }, 400);
}
// ===========================
// INICIAR
// ===========================

renderHistorico();
renderFuncionarios();
renderHistoricoPontos();
renderArmarios();
atualizarContadorLocal()

