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
        // Garante que todos os botões e popups da nova aba de materiais funcionem
    if (typeof inicializarNavegacao === "function") {
        inicializarNavegacao();
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

            mostrarToast("Dados enviados para planilha");

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
            mostrarToast("Erro ao salvar os dados.");

        }

    }, 1000);

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
        return mostrarToast("Preencha tudo");
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
    const nome = document.getElementById("nomeFuncionario").value;
    const funcao = document.getElementById("funcaoFuncionario").value;
    const entrada = document.getElementById("entradaFuncionario").value;
    const saida = document.getElementById("saidaFuncionario").value;
    const alojamento = document.getElementById("alojamentoFuncionario").value;
    
    // CAPTURA DOS CAMPOS (VR volta a ser select, VT é o novo input de valor)
    const vr = document.getElementById("vrFuncionario").value;
    const vtInput = document.getElementById("vtFuncionario").value.trim();

    // VALIDAÇÃO: Garante que todos os campos obrigatórios estejam preenchidos
    if(!nome || !funcao || !entrada || !saida){
        mostrarToast("Por favor, preencha todos os campos do funcionário.");
        return;
    }

    // TRATAMENTO DO VALE TRANSPORTE: Converte para número puro (se vazio, vira 0)
    const valeTransporteValor = vtInput !== "" ? Number(vtInput) : 0;

    // VERIFICA SE ESTÁ EDITANDO OU CRIANDO UM NOVO
    if (idFuncionarioEditando !== null) {
        const funcionario = funcionarios.find(f => f.id === idFuncionarioEditando);
        
        if (funcionario) {
            funcionario.nome = nome;
            funcionario.funcao = funcao;
            funcionario.entrada = Number(entrada);
            funcionario.saida = Number(saida);
            funcionario.alojamento = alojamento;
            funcionario.vr = vr; // Envia "Sim" ou "Não" direto do select
            funcionario.valeTransporte = valeTransporteValor;
            
            mostrarToast("Funcionário atualizado com sucesso!");
        }
        idFuncionarioEditando = null;
    } else {
        // ADICIONA O NOVO FUNCIONÁRIO AO ARRAY
        funcionarios.push({
            id: Date.now(),
            nome,
            funcao,
            entrada: Number(entrada),
            saida: Number(saida),
            alojamento,
            vr, // Envia "Sim" ou "Não" direto do select
            valeTransporte: valeTransporteValor
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
    document.getElementById("vrFuncionario").value = "Não"; // Reseta o select para "Não"
    document.getElementById("vtFuncionario").value = "";    // Limpa o input do VT

    // Restaura o texto padrão do botão
    const botaoSalvar = document.querySelector("button[onclick='salvarFuncionario()']");
    if (botaoSalvar) {
        botaoSalvar.textContent = "Salvar Funcionário";
    }
}

function renderFuncionarios(lista = funcionarios){
    const div = document.getElementById("listaFuncionarios");
    if (!div) {
        console.warn("Aviso: Elemento 'listaFuncionarios' não está visível nesta tela. Renderização ignorada.");
        return;
    }

    div.innerHTML = "";
    const hoje = new Date().toLocaleDateString("pt-BR");
    const agoraTimestamp = new Date().getTime();
    const tresHorasEmMs = 3 * 60 * 60 * 1000;

    lista.forEach(funcionario => {
        const registro = pontos.find(p => p.funcionarioId === funcionario.id && p.data === hoje);
        let classeStatus = "vermelho";

        if (registro) {
            if (registro.saida) { classeStatus = "azul"; } 
            else if (registro.almocoRetorno) { classeStatus = "laranja"; } 
            else if (registro.almocoSaida) { classeStatus = "verde"; } 
            else if (registro.entrada) {
                const tempoDecorrido = agoraTimestamp - (registro.timestampEntrada || agoraTimestamp);
                classeStatus = tempoDecorrido > tresHorasEmMs ? "laranja" : "verde";
            }
        }

        const entradaExibicao = (funcionario.entrada !== undefined && funcionario.entrada !== null) ? funcionario.entrada : "--";
        const saidaExibicao = (funcionario.saida !== undefined && funcionario.saida !== null) ? funcionario.saida : "--";
        
        // Exibição dos benefícios nos cards da tela
        const vtExibicao = funcionario.valeTransporte ? Number(funcionario.valeTransporte).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00";
        const vrExibicao = (funcionario.vr === "Sim" || Number(funcionario.vr) > 0) ? "R$ 17,00" : "Não";

        div.innerHTML += `
        <div class="funcionario ${classeStatus}">
            <strong>${funcionario.nome}</strong>
            <p>Função: ${funcionario.funcao}</p>
            <p>Horário: ${entradaExibicao}h às ${saidaExibicao}h</p>
            <p><small>VR: ${vrExibicao} | VT: ${vtExibicao}</small></p>
            <div class="botoes">
                <button class="btn-editar" onclick="editarFuncionario(${funcionario.id})">Editar</button>
                <button class="btn-ponto" onclick="baterPonto(${funcionario.id})">Bater Ponto</button>
            </div>
        </div>
        `;
    });
}

function editarFuncionario(id){
    // TRAVA ATRAVÉS DA INTERFACE: Busca o botão de atualizar na tela
    const botaoAtualizar = document.querySelector("button[onclick='atualizarDadosDaPlanilha()']");
    
    // Se o botão existir e estiver desativado (ou mostrando a ampulheta), bloqueia a edição na hora
    if (botaoAtualizar && (botaoAtualizar.disabled || botaoAtualizar.innerHTML === "⌛")) {
        mostrarToast("Aguarde a atualização dos dados terminar para poder editar!");
        return;
    }

    // Garante compatibilidade total convertendo ambos os IDs para string/texto na busca
    const funcionario = funcionarios.find(f => String(f.id).trim() === String(id).trim());
    
    if(!funcionario) {
        console.error("Funcionário com ID " + id + " não foi encontrado no array local.");
        mostrarToast("Erro: Funcionário não localizado internamente.");
        return;
    }

    // Guarda o ID do funcionário que estamos editando (mantendo o tipo original)
    idFuncionarioEditando = funcionario.id;

    // Preenche os campos do formulário com os dados atuais dele
    document.getElementById("nomeFuncionario").value = funcionario.nome || "";
    document.getElementById("funcaoFuncionario").value = funcionario.funcao || "";
    document.getElementById("entradaFuncionario").value = funcionario.entrada !== undefined ? funcionario.entrada : "";
    document.getElementById("saidaFuncionario").value = funcionario.saida !== undefined ? funcionario.saida : "";
    document.getElementById("alojamentoFuncionario").value = funcionario.alojamento || "Não";
    
    // Tratamento do Select do VR
    document.getElementById("vrFuncionario").value = (funcionario.vr === "Sim" || Number(funcionario.vr) > 0) ? "Sim" : "Não";
    
    // Tratamento do Input do Vale Transporte
    document.getElementById("vtFuncionario").value = funcionario.valeTransporte !== undefined ? funcionario.valeTransporte : "0";

    // Altera o texto do botão de salvar para dar o feedback de atualização
    const botaoSalvar = document.querySelector("button[onclick='salvarFuncionario()']");
    if(botaoSalvar) {
        botaoSalvar.textContent = "Atualizar Dados";
    }

    // Alerta e rola a página para o topo
    mostrarToast("Dados carregados no formulário acima!");
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
    }, 1000);
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

        return mostrarToast("Item não encontrado");

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

        return mostrarToast("Digite o motivo");

    }

    const item =
    historico.find(
        h => String(h.id) === String(idExtravio)
    );

    if(!item){

        return mostrarToast("Item não encontrado");

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

// Função acionada pelo botão da Lupa para abrir a tela e limpar buscas passadas
function abrirNovaAbaIndicadores() {
  if (typeof abrirAba === "function") abrirAba('indicadores');
  
  document.getElementById("inputBuscaFuncionario").value = "";
  document.getElementById("mensagemFeedback").innerText = "";
  document.getElementById("cardResultadoFuncionario").style.display = "none";
  
  // Nova Linha: Garante que a lista comece escondida e vazia
  const lista = document.getElementById("listaSugestoes");
  if (lista) {
    lista.style.display = "none";
    lista.innerHTML = "";
  }
}

// Mecanismo que faz o cruzamento dos dados locais (Cadastro) + dados remotos (Backup)
function buscarFuncionarioIndividual() {
  const termoBusca = document.getElementById("inputBuscaFuncionario").value.trim().toLowerCase();
  const feedback = document.getElementById("mensagemFeedback");
  const cardResultado = document.getElementById("cardResultadoFuncionario");
  const btn = document.getElementById("btnBuscarIndicadores");

  if (!termoBusca) {
    feedback.style.color = "#e74c3c";
    feedback.innerText = "Por favor, digite um Nome ou ID para pesquisar.";
    cardResultado.style.display = "none";
    return;
  }

  feedback.style.color = "#f39c12";
  feedback.innerText = "Localizando dados cadastrais...";

  // Seu sistema armazena a lista de funcionários na memória. Vamos buscar nela:
  let listaCadastrada = [];
  if (typeof funcionarios !== "undefined") {
    listaCadastrada = funcionarios;
  } else if (typeof listaFuncionariosMemoria !== "undefined") {
    listaCadastrada = listaFuncionariosMemoria;
  }

  // Localiza o funcionário comparando ID numérico ou trecho do nome
  const funcCadastrado = listaCadastrada.find(f => 
    String(f.id).toLowerCase() === termoBusca || 
    String(f.nome).toLowerCase().includes(termoBusca)
  );

  if (!funcCadastrado) {
    feedback.style.color = "#e74c3c";
    feedback.innerText = "Funcionário não encontrado no cadastro ativo do sistema.";
    cardResultado.style.display = "none";
    return;
  }

  feedback.innerText = "Buscando saldos e faltas na planilha de backup...";
  btn.disabled = true;

  // Monta o link utilizando a sua variável global 'urlWebApp' e adiciona a ação
  const urlFinal = `${urlWebApp}?acao=consultarIndicadores`;

  fetch(urlFinal)
    .then(response => response.json())
    .then(retorno => {
      btn.disabled = false;

      if (retorno.sucesso) {
        // Localiza os indicadores correspondentes usando a chave primária (ID)
        const indicadores = retorno.dados.find(i => String(i.id).trim() === String(funcCadastrado.id).trim());

        // Define valores de segurança caso o funcionário ainda não tenha pontos registrados no mês
        const saldoFinal = indicadores ? indicadores.saldoBancoHoras : "00:00";
        const faltasFinais = indicadores ? indicadores.faltas : 0;

        // Preenche o layout com o cruzamento dos dados
        document.getElementById("viewId").innerText = funcCadastrado.id;
        document.getElementById("viewNome").innerText = funcCadastrado.nome;
        document.getElementById("viewFuncao").innerText = funcCadastrado.funcao || "Não cadastrada";
        document.getElementById("viewAlojado").innerText = funcCadastrado.alojamento || funcCadastrado.alojamentoFuncionario || "Não";
        document.getElementById("viewVR").innerText = funcCadastrado.vr || funcCadastrado.vrFuncionario || "Não";

        // Regra de cor para o saldo: vermelho para devedor (-), verde para positivo ou zerado
        const elSaldo = document.getElementById("viewSaldo");
        elSaldo.innerText = saldoFinal;
        elSaldo.style.color = saldoFinal.startsWith("-") ? "#e74c3c" : "#2ecc71";
        elSaldo.style.fontWeight = "bold";

        document.getElementById("viewFaltas").innerText = `${faltasFinais} falta(s) detectada(s)`;

        feedback.innerText = "";
        cardResultado.style.display = "block"; // Revela a ficha completa do funcionário

        // =========================================================================
        // LOCAL CORRETO: Dispara o histórico após renderizar o card e usa o ID correto
        // =========================================================================
        buscarERenderizarHistoricoServicos(funcCadastrado.id);

      } else {
        feedback.style.color = "#e74c3c";
        feedback.innerText = "Erro ao ler a planilha de backup: " + retorno.mensagem;
      }
    })
    .catch(erro => {
      btn.disabled = false;
      feedback.style.color = "#e74c3c";
      feedback.innerText = "Falha de conexão com o servidor: " + erro;
    });
}

// Função que filtra os funcionários cadastrados em tempo real enquanto digita
function filtrarSugestoes() {
  const input = document.getElementById("inputBuscaFuncionario");
  const listaContainer = document.getElementById("listaSugestoes");
  const termo = input.value.trim().toLowerCase();

  // Se o campo estiver vazio, esconde a lista e encerra
  if (!termo) {
    listaContainer.style.display = "none";
    listaContainer.innerHTML = "";
    return;
  }

  // Puxa a lista de funcionários carregada na memória do seu app
  let listaCadastrada = [];
  if (typeof funcionarios !== "undefined") {
    listaCadastrada = funcionarios;
  } else if (typeof listaFuncionariosMemoria !== "undefined") {
    listaCadastrada = listaFuncionariosMemoria;
  }

  // Filtra por trechos do Nome ou do Cargo (Função)
  let filtrados = listaCadastrada.filter(f => 
    String(f.nome).toLowerCase().includes(termo) || 
    String(f.funcao || f.cargo).toLowerCase().includes(termo)
  );

  // Organiza os resultados em Ordem Alfabética (pelo Nome)
  filtrados.sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

  // Se não encontrar ninguém com aquele termo
  if (filtrados.length === 0) {
    listaContainer.innerHTML = '<div style="padding: 10px; color: #999; font-size: 0.9rem;">Nenhum funcionário encontrado</div>';
    listaContainer.style.display = "block";
    return;
  }

  // Monta a lista visual de sugestões (Nome e Cargo)
  listaContainer.innerHTML = "";
  filtrados.forEach(f => {
    const item = document.createElement("div");
    const cargo = f.funcao || f.cargo || "Não Informado";
    
    // Estilização simples de linha
    item.style.padding = "10px";
    item.style.cursor = "pointer";
    item.style.borderBottom = "1px solid #f5f5f5";
    item.style.transition = "background 0.2s";
    
    // Efeito hover (mudar cor ao passar o mouse)
    item.onmouseenter = () => item.style.backgroundColor = "#fdf6f6";
    item.onmouseleave = () => item.style.backgroundColor = "white";
    
    // Conteúdo: Nome destacado em cima e cargo menor em baixo
    item.innerHTML = `
      <div style="font-weight: bold; color: #333;">${f.nome}</div>
      <div style="font-size: 0.8rem; color: #777;">Cargo: ${cargo}</div>
    `;
    
    // Ação ao clicar no item da lista
    item.onclick = () => selecionarFuncionarioSugestao(f.nome);
    
    listaContainer.appendChild(item);
  });

  listaContainer.style.display = "block";
}

// Executado quando o usuário clica em um item da lista filtrada
function selecionarFuncionarioSugestao(nomeSelecionado) {
  const input = document.getElementById("inputBuscaFuncionario");
  const listaContainer = document.getElementById("listaSugestoes");
  
  // Define o valor do input com o nome completo escolhido
  input.value = nomeSelecionado;
  
  // Fecha a caixinha de sugestões
  listaContainer.style.display = "none";
  listaContainer.innerHTML = "";
  
  // Dispara a busca detalhada de indicadores automaticamente
  buscarFuncionarioIndividual();
}

// Fecha a caixinha de sugestões caso o usuário clique fora do campo de busca
document.addEventListener("click", function(evento) {
  const containerSugestoes = document.getElementById("listaSugestoes");
  const campoInput = document.getElementById("inputBuscaFuncionario");
  
  if (containerSugestoes && evento.target !== campoInput && !containerSugestoes.contains(evento.target)) {
    containerSugestoes.style.display = "none";
  }
});

/**
 * Busca o histórico de serviços diretamente do WebApp (Planilha) via GET,
 * filtra pelo ID do funcionário atual e renderiza na tela.
 * * @param {string|number} funcionarioId - ID do funcionário buscado
 */
function buscarERenderizarHistoricoServicos(funcionarioId) {
  const container = document.getElementById("containerDinamicoServicos");
  
  // Mensagem visual menor de carregamento enquanto busca os dados na planilha
  container.innerHTML = `
    <div style="margin-top: 15px; text-align: center; color: #741b47; font-size: 0.85rem;">
      <p>Carregando histórico de serviços...</p>
    </div>`;

  // Faz a requisição GET para o seu WebApp
  fetch(urlWebApp)
    .then(resposta => resposta.json())
    .then(resultado => {
      if (!resultado.sucesso) {
        throw new Error(resultado.erro || "Falha ao obter dados do servidor.");
      }

      // Filtra os serviços da planilha que pertencem a este ID de funcionário
      const listaServicos = resultado.servicos || [];
      const servicosDoFuncionario = listaServicos.filter(s => 
        String(s.funcionarioId).trim() === String(funcionarioId).trim()
      );

      // Se não houver nenhum serviço cadastrado para ele
      if (servicosDoFuncionario.length === 0) {
        container.innerHTML = `
          <div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 6px; border: 1px solid #ddd; text-align: center; color: #7f8c8d; font-size: 0.85rem;">
            <p style="margin: 0;">Nenhum serviço registrado para este funcionário até o momento.</p>
          </div>`;
        return;
      }

      // Calcula o valor total acumulado somando as linhas
// Calcula o valor total acumulado somando apenas as linhas com status "Pendente"
const valorTotalAcumulado = servicosDoFuncionario.reduce((soma, item) => {
  if (item.status === "Pendente") {
    return soma + (Number(item.valorServico) || 0);
  }
  return soma;
}, 0);
      // Inicia a montagem da estrutura da Tabela do Index (Visual menor e minimalista)
      let html = `
        <div style="margin-top: 15px; padding: 12px; background: #fff; border-radius: 6px; border: 1px solid #e6b8af;">
          <h4 style="margin: 0 0 8px 0; color: #741b47; font-size: 0.95rem; border-bottom: 1px solid #f1daf3; padding-bottom: 3px;">
            Serviços Prestados
          </h4>
          
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
              <thead>
                <tr style="background-color: #741b47; color: white;">
                  <th style="padding: 6px 8px; border-radius: 4px 0 0 4px;">Data</th>
                  <th style="padding: 6px 8px;">Tipo de Serviço</th>
                  <th style="padding: 6px 8px; text-align: right;">Valor</th>
                  <th style="padding: 6px 8px; text-align: center; border-radius: 0 4px 4px 0;">Status</th>
                </tr>
              </thead>
              <tbody>
      `;

      // Popula as linhas da tabela aplicando efeito zebra e tratando o status com botão
      servicosDoFuncionario.forEach((servico, index) => {
        const fundoLinha = index % 2 === 0 ? "white" : "#fbf4f7";
        const valorFormatado = Number(servico.valorServico).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        // Renderização inteligente do Status (Botão Pagar VS Tag Pago)
        let htmlStatus = "";
        if (servico.status === "Pago") {
          htmlStatus = `<span style="background: #27ae60; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">Pago</span>`;
        } else {
          htmlStatus = `
            <button onclick="alterarStatusParaPago(${servico.numLinha}, ${servico.funcionarioId})" 
                    style="background: #f39c12; color: white; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.75rem; transition: 0.2s;"
                    onmouseenter="this.style.background='#d35400'" onmouseleave="this.style.background='#f39c12'">
              Pagar
            </button>`;
        }

        html += `
          <tr style="background-color: ${fundoLinha}; border-bottom: 1px solid #f1daf3;">
            <td style="padding: 6px 8px; white-space: nowrap;">${servico.dataRealizacao || '-'}</td>
            <td style="padding: 6px 8px;">${servico.tipoServico}</td>
            <td style="padding: 6px 8px; text-align: right; font-weight: bold; color: #2c3e50;">${valorFormatado}</td>
            <td style="padding: 6px 8px; text-align: center;">${htmlStatus}</td>
          </tr>
        `;
      });

      const totalGeralFormatado = valorTotalAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      // Fecha a tabela e insere o painel com o Total Acumulado compactado
      html += `
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 8px; text-align: right; font-size: 0.85rem; color: #741b47;">
            <strong>Total a ser Pago :</strong> 
            <span style="font-size: 0.9rem; font-weight: bold; background: #741b47; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 3px;">
              ${totalGeralFormatado}
            </span>
          </div>
        </div>
      `;

      // Atualiza o container dinâmico com o HTML gerado
      container.innerHTML = html;
    })
    .catch(erro => {
      console.error("Erro ao buscar histórico:", erro);
      container.innerHTML = `
        <div style="margin-top: 15px; padding: 10px; background: #fff5f5; border: 1px solid #c0392b; border-radius: 6px; color: #c0392b; text-align: center; font-size: 0.8rem;">
          Erro ao atualizar histórico de serviços. Verifique a conexão.
        </div>`;
    });
}

/**
 * Envia o comando para o Backend atualizar a linha do serviço para "Pago"
 */
function alterarStatusParaPago(numLinha, funcionarioId) {
  // Alerta de confirmação removido! O clique agora é direto e imediato.

  const payload = {
    acaoStatus: "mudarParaPago",
    numLinha: numLinha
  };

  fetch(urlWebApp, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  })
  .then(resposta => {
    if (!resposta.ok) throw new Error("Erro na resposta da rede.");
    return resposta.json();
  })
  .then(resultado => {
    if (resultado.sucesso) {
      // Mantém estritamente o Toast visual na tela
      if (typeof mostrarToast === "function") {
        mostrarToast("Serviço pago com sucesso!");
      }
      
      // Recarrega o histórico na hora para mudar o botão laranja para o selo verde "Pago"
      buscarERenderizarHistoricoServicos(funcionarioId);
      
    } else {
      mostrarToast("Erro ao salvar pagamento: " + resultado.erro);
    }
  })
  .catch(erro => {
    console.error(erro);
    mostrarToast("Falha de conexão ao registrar pagamento.");
  });
}
function lancarNovoServicoDireto() {
  const btn = document.getElementById("btnConfirmarServico");
  const funcionarioId = document.getElementById("viewId").innerText;
  const nomeFuncionario = document.getElementById("viewNome").innerText;
  const funcao = document.getElementById("viewFuncao").innerText;
  
  let dataInput = document.getElementById("inputDataServico").value; // Formato padrão: yyyy-mm-dd
  const tipoServico = document.getElementById("inputTipoServico").value.trim();
  const valorServico = document.getElementById("inputValorServico").value.trim();

  // 1. Validação básica de preenchimento dos campos
  if (!dataInput || !tipoServico || !valorServico) {
    mostrarToast("Por favor, preencha todos os campos (Data, Tipo e Valor) antes de salvar.");
    return;
  }

  // 2. Converte a data de 'yyyy-mm-dd' para 'dd/mm/yyyy' para manter o padrão das suas tabelas
  if (dataInput.includes("-")) {
    const partes = dataInput.split("-");
    dataInput = `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // 3. Monta o objeto (payload) enviado para a função salvarServicos no backend
  const payloadPost = {
    servicos: [
      {
        funcionarioId: Number(funcionarioId),
        nomeFuncionario: nomeFuncionario,
        funcao: funcao,
        dataRealizacao: dataInput,
        tipoServico: tipoServico,
        valorServico: Number(valorServico)
        // O status "Pendente" é injetado automaticamente pelo backend ao salvar
      }
    ]
  };

  // 4. Bloqueia o botão temporariamente para evitar cliques duplos acidentais
  btn.disabled = true;
  btn.innerText = "Gravando na Planilha...";
  btn.style.backgroundColor = "#95a5a6";

  // 5. Envia os dados usando POST para a sua variável global 'urlWebApp'
  fetch(urlWebApp, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payloadPost)
  })
  .then(resposta => resposta.json())
  .then(resultado => {
    if (resultado.sucesso) {
      
      // Exibe o Toast de sucesso
      if (typeof mostrarToast === "function") {
        mostrarToast("Serviço lançado com sucesso!");
      } else {
        mostrarToast("Serviço lançado com sucesso!");
      }

      // Limpa os campos do formulário para o próximo lançamento
      document.getElementById("inputDataServico").value = "";
      document.getElementById("inputTipoServico").value = "";
      document.getElementById("inputValorServico").value = "";

      // Atualiza a tabela de histórico compacta imediatamente na tela (recalculando as linhas e botões de pagar)
      if (typeof buscarERenderizarHistoricoServicos === "function") {
        buscarERenderizarHistoricoServicos(funcionarioId);
      }

    } else {
      mostrarToast("Erro retornado pelo servidor: " + (resultado.erro || "Falha desconhecida"));
    }
  })
  .catch(erro => {
    console.error("Erro na requisição POST:", erro);
    mostrarToast("Falha de comunicação com o servidor ao gravar o serviço.");
  })
  .finally(() => {
    // 6. Restaura as propriedades originais do botão
    btn.disabled = false;
    btn.innerText = "Confirmar e Gravar Serviço";
    btn.style.backgroundColor = "#741b47";
  });
}
function carregarMateriaisPendentes() {
    const container = document.getElementById("lista-materiais-container");
    if (!container) return;

    // Coloca uma mensagem de carregando enquanto busca os dados na planilha
    container.innerHTML = '<p class="txt-aviso">Buscando materiais na planilha... ⏳</p>'; 

    // Dispara um GET para a URL do seu WebApp (o seu backend vai rodar o doGet)
    // Nota: Se o seu doGet precisar de um parâmetro específico (ex: acao=lerLista), adicione na URL: urlWebApp + "?acao=lerLista"
    fetch(urlWebApp) 
        .then(resposta => resposta.json())
        .then(dadosDoSistema => {
            container.innerHTML = ""; 

            // Pega a lista que veio direto da planilha
            // (Ajuste o nome 'listaCompras' caso no JSON do seu doGet ele venha com outro nome, ex: 'lista')
            const listaOriginal = dadosDoSistema.listaCompras || [];

            // Filtra para exibir APENAS itens com status "Pendente"
            const itensPendentes = listaOriginal.filter(item => String(item.status).trim().toLowerCase() === "pendente");

            if (itensPendentes.length === 0) {
                container.innerHTML = '<p class="txt-vazio">Nenhum material pendente no momento! 🎉</p>';
                // [AJUSTE FINO]: Mesmo sem pendentes na tela principal, o carrinho precisa ser chamado para carregar os seus itens internos
                if (typeof gerarListaDentroDoCarrinho === "function") {
                    gerarListaDentroDoCarrinho(dadosDoSistema); 
                }
                return;
            }

            // Desenha os itens na tela
            itensPendentes.forEach((item) => {
                const itemDiv = document.createElement("div");
                itemDiv.className = "item-material-linha";

                // [AJUSTE FINO DE CORES]: Proteção dupla para garantir cor viva independente da grafia da função global de cor
                let corTag = "#e2e8f0";
                if (typeof obterCorPrioridade === 'function') {
                    corTag = obterCorPrioridade(item.prioridade);
                } else if (typeof obtenerCorPrioridade === 'function') {
                    corTag = obtenerCorPrioridade(item.prioridade);
                }

                // Nova estrutura: Texto isolado na esquerda, Prioridade + Botão colados na direita
                itemDiv.innerHTML = `
                    <div class="item-material-info">
                        <span class="item-material-nome" title="${item.material}">${item.material}</span>
                    </div>
                    <div class="item-material-acoes">
                        <span class="tag-prioridade" style="background-color: ${corTag};">
                            ${item.prioridade}
                        </span>
                        <button type="button" class="btn-para-carrinho" title="Adicionar ao carrinho">
                            🛒
                        </button>
                    </div>
                `;

                const btnParaCarrinho = itemDiv.querySelector(".btn-para-carrinho");

if (btnParaCarrinho) {
    btnParaCarrinho.addEventListener("click", function () {
        if (typeof mudarStatusParaComprado === "function") { 
            
            // [CORREÇÃO]: Passa "carrinho" em minúsculo para manter a consistência com o banco
            mudarStatusParaComprado(
                item.material,
                itemDiv,
                "carrinho",
                "lista-materiais-container",
                '<p class="txt-vazio" style="color: #718096; font-style: italic; text-align: center; padding: 30px; background: #f7fafc; border-radius: 8px; border: 1px dashed #e2e8f0; margin: 0;">Nenhum material pendente no momento! 🎉</p>'
            );
            
            // [CORREÇÃO CRUCIAL]: Damos um pequeníssimo "respiro" (delay) de 50ms para a memória 
            // processar a alteração do status do objeto antes de forçar o carrinho a se redesenhar.
            setTimeout(() => {
                if (typeof forcarRecarregamentoCarrinho === "function") {
                    forcarRecarregamentoCarrinho();
                } else if (typeof gerarListaDentroDoCarrinho === "function") {
                    gerarListaDentroDoCarrinho();
                }
            }, 50);
        }
    });
}

                container.appendChild(itemDiv);
            });

            // [AJUSTE FINO]: Passando os dados recebidos para que o carrinho consiga ler a listaCompras sem travar
            if (typeof gerarListaDentroDoCarrinho === "function") {
                gerarListaDentroDoCarrinho(dadosDoSistema); 
            }
        })
        .catch(erro => {
            console.error("Erro ao carregar materiais da planilha:", erro);
            container.innerHTML = '<p class="txt-erro">Erro ao carregar a lista de materiais. ❌</p>';
        });
}

function inicializarNavegacao() {
    const btnIrParaLista = document.getElementById("btn-ir-para-lista");
    const btnFlutuanteCarrinho = document.getElementById("btn-flutuante-carrinho");
    const btnFecharPopup = document.getElementById("btn-fechar-popup");
    const popupCarrinho = document.getElementById("pop-up-carrinho");
    
    const btnAdicionarMaterial = document.getElementById("btn-adicionar-material");

if (typeof gerarListaDentroDoCarrinho === "function") {
        const dadosMapeados = typeof dadosGlobaisDoSistema !== "undefined" ? dadosGlobaisDoSistema : {};
        gerarListaDentroDoCarrinho(dadosMapeados);
    }
    // Ação do Botão (+) para abrir a Seção/Aba de Materiais
    if (btnIrParaLista) {
        btnIrParaLista.addEventListener("click", function () {
            const abaEstoque = document.getElementById("aba-estoque");
            if (abaEstoque) abaEstoque.style.display = "none";

            const abaMateriais = document.getElementById("aba-materiais");
            if (abaMateriais) abaMateriais.style.display = "block";

            if (typeof carregarMateriaisPendentes === "function") {
                carregarMateriaisPendentes();
            }
        });
    }

    // Evento do botão modificado para ser 100% compatível com a rede e com o backend
    if (btnAdicionarMaterial) {
        btnAdicionarMaterial.addEventListener("click", function () {
            const inputMaterial = document.getElementById("input-material");
            const inputPrioridade = document.getElementById("input-prioridade");

            if (!inputMaterial || !inputPrioridade) return;

            const nomeMaterial = inputMaterial.value.trim();
            const prioridadeSelecionada = inputPrioridade.value;

            if (!nomeMaterial) {
                mostrarToast("Por favor, digite o nome do material.");
                return;
            }
            if (!prioridadeSelecionada) {
                mostrarToast("Por favor, selecione uma prioridade.");
                return;
            }

            // Alinhado para usar 'listas' exatamente como na outra função e no backend
            const novoItem = {
                listas: [
                    {
                        material: nomeMaterial,
                        prioridade: prioridadeSelecionada,
                        status: "Pendente"
                    }
                ]
            };

            btnAdicionarMaterial.disabled = true;
            btnAdicionarMaterial.innerText = "Adicionando...";

            const formBody = new URLSearchParams();
            formBody.append("payload", JSON.stringify(novoItem));

            fetch(urlWebApp, {
                method: "POST",
                mode: "no-cors",
                headers: { 
                    "Content-Type": "application/x-www-form-urlencoded" 
                },
                body: formBody
            })
            .then(() => {
                mostrarToast("Material adicionado com sucesso! 🎉");

                if (typeof dadosGlobaisDoSistema !== "undefined") {
                    if (!dadosGlobaisDoSistema.listaCompras) {
                        dadosGlobaisDoSistema.listaCompras = [];
                    }
                    dadosGlobaisDoSistema.listaCompras.push({
                        material: nomeMaterial,
                        prioridade: prioridadeSelecionada,
                        status: "Pendente"
                    });
                }

                if (typeof carregarMateriaisPendentes === "function") {
                    carregarMateriaisPendentes();
                }

                inputMaterial.value = "";
                inputPrioridade.value = "";
            })
            .catch(erro => {
                console.error("Erro ao enviar material:", erro);
                mostrarToast("Erro de conexão ao tentar salvar o material.");
            })
            .finally(() => {
                btnAdicionarMaterial.disabled = false;
                btnAdicionarMaterial.innerText = "Adicionar à Lista";
            });
        });
    }

    if (btnFlutuanteCarrinho) {
        btnFlutuanteCarrinho.addEventListener("click", function () {
            if (popupCarrinho) popupCarrinho.style.display = "flex";
            
            if (typeof gerarListaDentroDoCarrinho === "function") {
                const dadosMapeados = typeof dadosGlobaisDoSistema !== "undefined" ? dadosGlobaisDoSistema : {};
                gerarListaDentroDoCarrinho(dadosMapeados);
            }
        });
    }

    if (btnFecharPopup) {
        btnFecharPopup.addEventListener("click", function () {
            if (popupCarrinho) popupCarrinho.style.display = "none";
        });
    }

    window.addEventListener("click", function (event) {
        if (event.target === popupCarrinho) {
            popupCarrinho.style.display = "none";
        }
    });
}

// =========================================================================
// FUNÇÃO: CONFIGURAR VALIDAÇÃO EM TEMPO REAL DO POP-UP DO CARRINHO
// =========================================================================
// --- FUNÇÃO AUXILIAR PARA OS BOTÕES (Muda a cor e joga o valor pro input) ---
// 1. FUNÇÃO DE CONTROLE DOS BOTÕES (Coloque junto ao seu script)
function selecionarEmpresa(botaoObjeto, nomeEmpresa) {
    const inputEmpresa = document.getElementById("input-empresa-hist");
    
    // Reseta o estilo visual de todos os botões de empresa (volta para o padrão branco)
    document.querySelectorAll('.btn-opcao-empresa').forEach(btn => {
        btn.style.backgroundColor = "#ffffff";
        btn.style.color = "#495057";
        btn.style.borderColor = "#ced4da";
    });
    
    // Aplica o estilo de selecionado no botão clicado (muda para fundo escuro)
    botaoObjeto.style.backgroundColor = "#495057";
    botaoObjeto.style.color = "#ffffff";
    botaoObjeto.style.borderColor = "#495057";
    
    // Atualiza o valor oculto e avisa o validador original que houve uma mudança
    if (inputEmpresa) {
        inputEmpresa.value = nomeEmpresa;
        inputEmpresa.dispatchEvent(new Event('input')); 
    }
}

// 2. SUA FUNÇÃO ORIGINAL ADAPTADA PARA FAZER A TROCA DOS BOTÕES
function configurarValidacaoCarrinho() {
    const inputValor = document.getElementById("input-valor-hist");
    const inputResponsavel = document.getElementById("input-responsavel-hist");
    let inputEmpresa = document.getElementById("input-empresa-hist"); 
    const btnSalvarHistorico = document.getElementById("btn-salvar-historico");

    // =========================================================================
    // TRECHO ADICIONADO: ESCONDE O INPUT DE TEXTO E INJETA OS BOTÕES
    // =========================================================================
    if (inputEmpresa && inputEmpresa.type === "text") {
        const colunaPai = inputEmpresa.parentElement;
        
        // Torna a caixa de texto invisível (ela continuará guardando o valor para o formulário)
        inputEmpresa.type = "hidden";
        inputEmpresa.value = ""; 
        
        // Alinha a coluna pai para comportar os botões empilhados
        colunaPai.style.display = "flex";
        colunaPai.style.flexDirection = "column";
        colunaPai.style.justifyContent = "flex-end";
        colunaPai.style.gap = "4px";

        // Cria o botão da Bruna Construção
        const btnBruna = document.createElement("button");
        btnBruna.type = "button";
        btnBruna.className = "btn-opcao-empresa";
        btnBruna.innerText = "Bruna Const.";
        btnBruna.style.cssText = "width: 100%; padding: 5px; font-size: 11px; background-color: #fff; color: #495057; border: 1px solid #ced4da; border-radius: 4px; cursor: pointer; text-align: center; height: 22px; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
        btnBruna.onclick = function() { selecionarEmpresa(this, 'Bruna construção'); };

        // Cria o botão da Gomes Lopes
        const btnGomes = document.createElement("button");
        btnGomes.type = "button";
        btnGomes.className = "btn-opcao-empresa";
        btnGomes.innerText = "Gomes Lopes";
        btnGomes.style.cssText = "width: 100%; padding: 5px; font-size: 11px; background-color: #fff; color: #495057; border: 1px solid #ced4da; border-radius: 4px; cursor: pointer; text-align: center; height: 22px; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
        btnGomes.onclick = function() { selecionarEmpresa(this, 'Gomes Lopes'); };

        // Coloca os botões dentro da div onde ficava o input de texto
        colunaPai.appendChild(btnBruna);
        colunaPai.appendChild(btnGomes);
    }
    // =========================================================================

    if (inputValor && inputResponsavel && inputEmpresa && btnSalvarHistorico) {
        
        function checarCampos() {
            const valorPreenchido = inputValor.value.trim() !== "";
            const responsavelPreenchido = inputResponsavel.value.trim() !== "";
            const empresaPreenchida = inputEmpresa.value.trim() !== "";

            if (valorPreenchido && responsavelPreenchido && empresaPreenchida) {
                btnSalvarHistorico.disabled = false;
                btnSalvarHistorico.style.opacity = "1";
                btnSalvarHistorico.style.cursor = "pointer";
            } else {
                btnSalvarHistorico.disabled = true;
                btnSalvarHistorico.style.opacity = "0.6";
                btnSalvarHistorico.style.cursor = "not-allowed";
            }
        }

        inputValor.addEventListener("input", checarCampos);
        inputResponsavel.addEventListener("input", checarCampos);
        inputEmpresa.addEventListener("input", checarCampos);
    }
}

// =========================================================================
// FUNÇÃO: VINCULAR GATILHO DE CLIQUE DO BOTÃO DE SALVAR HISTÓRICO (100% ORIGINAL)
// =========================================================================
function inicializarSalvamentoCarrinho() {
    const btnSalvarHistorico = document.getElementById("btn-salvar-historico");

    if (btnSalvarHistorico) {
        btnSalvarHistorico.addEventListener("click", function () {
            const inputValor = document.getElementById("input-valor-hist");
            const inputResponsavel = document.getElementById("input-responsavel-hist");
            const inputEmpresa = document.getElementById("input-empresa-hist");

            const valorValor = inputValor.value.trim();
            const responsavelValor = inputResponsavel.value.trim();
            const empresaValor = inputEmpresa.value.trim();

            if (!valorValor || !responsavelValor || !empresaValor) return;

            btnSalvarHistorico.disabled = true;
            btnSalvarHistorico.innerText = "Finalizando...";

            const payload = {
                historicoLista: {
                    valorTotal: parseFloat(valorValor),
                    responsavel: responsavelValor,
                    empresa: empresaValor,
                    data: new Date().toLocaleDateString("pt-BR")
                }
            };

            const formBody = new URLSearchParams();
            formBody.append("payload", JSON.stringify(payload));

           fetch(urlWebApp, {
                method: "POST",
                mode: "no-cors",
                headers: { 
                    "Content-Type": "application/x-www-form-urlencoded" 
                },
                body: formBody
            })
            .then(() => {
                mostrarToast("Carrinho finalizado e histórico registrado com sucesso! 🎉");
                
                inputValor.value = "";
                inputResponsavel.value = "";
                inputEmpresa.value = "";
                
                // Reseta visualmente a cor dos botões para o padrão branco após salvar
                document.querySelectorAll('.btn-opcao-empresa').forEach(btn => {
                    btn.style.backgroundColor = "#ffffff";
                    btn.style.color = "#495057";
                    btn.style.borderColor = "#ced4da";
                });
                
                const popupCarrinho = document.getElementById("pop-up-carrinho");
                if (popupCarrinho) popupCarrinho.style.display = "none";

                if (typeof carregarMateriaisPendentes === "function") {
                    carregarMateriaisPendentes();
                }
            })
            .catch(erro => {
                console.error("Erro ao salvar histórico do carrinho:", erro);
                mostrarToast("Erro ao conectar com o servidor.");
            })
            .finally(() => {
                btnSalvarHistorico.disabled = false;
                btnSalvarHistorico.innerText = "Finalizar e Salvar Histórico";
            });
        });
    }
    
}

// Chame as configurações na inicialização do DOM para deixar tudo vigiado e pronto
document.addEventListener("DOMContentLoaded", () => {
    configurarValidacaoCarrinho();
    inicializarSalvamentoCarrinho();
});


function gerarListaDentroDoCarrinho(dadosDoSistema) {
    const container = document.getElementById("lista-carrinho-container");
    const btnSalvarHistorico = document.getElementById("btn-salvar-historico");
    
    if (!container) return;

    if (!dadosDoSistema && typeof dadosGlobaisDoSistema !== "undefined") {
        dadosDoSistema = dadosGlobaisDoSistema;
    }

    if (!dadosDoSistema) dadosDoSistema = {};
    if (!dadosDoSistema.listaCompras) dadosDoSistema.listaCompras = [];

    container.innerHTML = "";

    let itensNoCarrinho = [];
    const carrinhoArmazenado = localStorage.getItem("carrinhoLocal");

    if (carrinhoArmazenado) {
        try {
            const cacheJson = JSON.parse(carrinhoArmazenado);
            if (Array.isArray(cacheJson) && cacheJson.length > 0) {
                itensNoCarrinho = cacheJson;
            }
        } catch (e) {
            console.error("Erro ao ler cache local do carrinho, limpando...", e);
            localStorage.removeItem("carrinhoLocal");
        }
    }

    if (itensNoCarrinho.length === 0) {
        itensNoCarrinho = dadosDoSistema.listaCompras.filter(item => 
            item && item.status && String(item.status).trim() === "carrinho"
        );
        
        if (itensNoCarrinho.length > 0) {
            localStorage.setItem("carrinhoLocal", JSON.stringify(itensNoCarrinho));
        }
    }

    if (itensNoCarrinho.length === 0) {
        container.innerHTML = '<p class="txt-vazio" style="color: #a0aec0; text-align: center; padding: 24px; font-size: 14px; margin: 0; font-style: italic;">O carrinho está vazio.</p>';
        if (btnSalvarHistorico) btnSalvarHistorico.disabled = true;
        return;
    }

    if (btnSalvarHistorico) btnSalvarHistorico.disabled = false;

    // 4. RENDERIZAÇÃO CORRIGIDA COM MAPEAMENTO FORÇADO
    itensNoCarrinho.forEach((item, index) => {
        // [RESOLUÇÃO DO BUG]: Mapeia exaustivamente todas as formas que o objeto pode ter assumido
        let nomeDoMaterial = "Material Sem Nome";
        
        if (typeof item === 'string') {
            nomeDoMaterial = item;
        } else if (item && typeof item === 'object') {
            nomeDoMaterial = item.material || item.Material || item.nome || item.Nome || item.item || "";
            
            // Se ainda assim estiver vazio, tenta pegar a primeira propriedade de texto encontrada no objeto
            if (!nomeDoMaterial) {
                const chaves = Object.keys(item);
                const chaveTexto = chaves.find(k => k !== 'status' && typeof item[k] === 'string');
                nomeDoMaterial = chaveTexto ? item[chaveTexto] : JSON.stringify(item);
            }
        }
        
        const prioridadeDoMaterial = item.prioridade || item.Prioridade || "Média";

        const itemDiv = document.createElement("div");
        
        // Estilo do container da linha ajustado
        itemDiv.style.display = "flex";
        itemDiv.style.justify = "space-between";
        itemDiv.style.alignItems = "center";
        itemDiv.style.padding = "14px 16px";
        itemDiv.style.borderBottom = "1px solid #edf2f7";
        itemDiv.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f8fafc";
        itemDiv.style.gap = "12px";
        itemDiv.style.boxSizing = "border-box";
        itemDiv.style.width = "100%";

        let corTag = "#cbd5e0";
        if (typeof obterCorPrioridade === 'function') {
            corTag = obterCorPrioridade(prioridadeDoMaterial);
        } else if (typeof obtenerCorPrioridade === 'function') {
            corTag = obtenerCorPrioridade(prioridadeDoMaterial);
        }

        // Layout corrigido: Força o bloco de texto a ocupar espaço físico real na tela (flex: 1)
        itemDiv.innerHTML = `
            <div style="display: flexblock; align-items: center; gap: 30px; flex: 1; min-width: 0;">
                <span style="font-size: 14px; font-weight: 600; color: #2d3748; word-break: break-all; white-space: normal; display: inline-block">
                    ${nomeDoMaterial}
                </span>
                <span class="tag-prioridade" style="background-color: ${corTag}; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: #ffffff; text-transform: uppercase; flex-shrink: 0; letter-spacing: 0.03em; display: inline-block;">
                    ${prioridadeDoMaterial}
                </span>
                 <button type="button" class="btn-remover-item-carrinho" style="background: #fff5f5; border: radius 1px solid #fed7d7; color: #e53e3e; font-size: 14px; cursor: pointer; padding: 0px 0px; display: flexblock; height: 24px; width: 60px;" title="Remover item do carrinho">
                ✕
            </button>
            </div>
           
        `;

        const btnRemover = itemDiv.querySelector(".btn-remover-item-carrinho");
        btnRemover.addEventListener("click", function () {
            if (typeof removerItemDoCarrinhoServidor === "function") {
                removerItemDoCarrinhoServidor(nomeDoMaterial, index, itemDiv, itensNoCarrinho, container, btnSalvarHistorico);
            }
        });

        container.appendChild(itemDiv);
    });
}
function removerItemDoCarrinhoServidor(nomeMaterial, indexNoArray, elementoHtml, arrayReferencia, containerHtml, botaoHistorico) {
    // -------------------------------------------------------------------------
    // 1. EXECUÇÃO IMEDIATA NO FRONT-END (Estado Puro Local)
    // -------------------------------------------------------------------------
    
    // Procura a posição exata do item no array por segurança
    const indexAtual = arrayReferencia.findIndex(item => 
        (item.material || item.Material || "").trim().toLowerCase() === String(nomeMaterial).trim().toLowerCase()
    );

    // Remove o item da memória local do carrinho
    if (indexAtual !== -1) {
        arrayReferencia.splice(indexAtual, 1);
    } else {
        arrayReferencia.splice(indexNoArray, 1);
    }
    
    // Atualiza o LocalStorage imediatamente
    localStorage.setItem("carrinhoLocal", JSON.stringify(arrayReferencia));

    // Sincroniza a lista global do sistema na RAM para o item voltar a ser pendente na tela de trás
    if (typeof dadosGlobaisDoSistema !== "undefined" && dadosGlobaisDoSistema.listaCompras) {
        const itemNaRAM = dadosGlobaisDoSistema.listaCompras.find(item => 
            (item.material || item.Material || "").trim().toLowerCase() === String(nomeMaterial).trim().toLowerCase()
        );
        if (itemNaRAM) {
            itemNaRAM.status = "pendente"; 
        }
    }

    // Some com a linha do HTML do carrinho instantaneamente
    if (elementoHtml) {
        elementoHtml.remove(); 
    }

    // Se o carrinho esvaziou, coloca o aviso na hora
    if (arrayReferencia.length === 0) {
        containerHtml.innerHTML = '<p class="txt-vazio" style="color: #6c757d; text-align: center; padding: 20px; font-size: 14px;">O carrinho está vazio.</p>';
        if (botaoHistorico) botaoHistorico.disabled = true;
    }

    if (typeof mostrarToast === "function") {
        mostrarToast(`"${nomeMaterial}" devolvido para a lista.`, "sucesso");
    }

    // Atualiza o painel de fundo (pendentes) em tempo real
    if (typeof carregarMateriaisPendentes === "function") {
        carregarMateriaisPendentes();
    }

    // -------------------------------------------------------------------------
    // 2. COMUNICAÇÃO CORRIGIDA COM O BACKEND (Segundo plano)
    // -------------------------------------------------------------------------
    const payload = {
        acao: "atualizarStatusMaterial", 
        material: String(nomeMaterial).trim(), // Remove espaços invisíveis que quebram o Procurar do Sheets
        status: "pendente" 
    };

    console.log("[Tentando Sincronizar] Enviando payload para o Sheets:", payload);

    fetch(urlWebApp, {
        method: "POST",
        // Usamos text/plain para evitar o bloqueio de CORS do Apps Script, mas o corpo é um JSON válido
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
        return res.json(); // Força a leitura da resposta real do Google Apps Script
    })
    .then(dados => {
        if (dados && dados.sucesso) {
            console.log(`[Sucesso Planilha] "${nomeMaterial}" mudou para pendente no Sheets.`);
        } else {
            // Se o Apps Script respondeu, mas não encontrou o material na planilha
            console.warn(`[Aviso Planilha] O servidor respondeu, mas informou erro:`, dados.mensagem || dados);
            if (typeof mostrarToast === "function") {
                mostrarToast("Erro ao sincronizar com a planilha.", "erro");
            }
        }
    })
    .catch(erro => {
        console.error("[Erro Crítico Planilha] Falha na comunicação com o Apps Script:", erro);
    });
}

function obterCorPrioridade(prioridade) {
    const p = String(prioridade).toLowerCase().trim();
    if (p === "urgência" || p === "urgencia") return "#7000ff"; // Roxo escuro para Urgência
    if (p === "alta") return "#dc3545"; // Vermelho
    if (p === "média" || p === "media") return "#ffc107"; // Amarelo
    return "#6c757d"; // Cinza para Baixa/Outros
}

function mudarStatusParaComprado(nomeMaterial, elementoHtmlDoItem, novoStatus, idContainer, msgVazioHtml) {
    const statusTratado = String(novoStatus).trim().toLowerCase();

    // =========================================================================
    // 1. CAPTURA DOS DADOS DIRETO DA TELA (Independente de variáveis ou Back-end)
    // =========================================================================
    const tagPrioridade = elementoHtmlDoItem.querySelector(".tag-prioridade");
    const textoPrioridade = tagPrioridade ? tagPrioridade.innerText.trim() : "Média";

    const novoItemCarrinho = {
        material: nomeMaterial,
        prioridade: textoPrioridade,
        status: statusTratado
    };

    // =========================================================================
    // 2. INJEÇÃO DIRETA NO CARRINHO LOCAL (Modificado para limpar o anterior)
    // =========================================================================
    // Removido o bloco que trazia os itens antigos do localStorage.
    // Agora criamos uma lista totalmente limpa (vazia) contendo apenas o novo item.
    let carrinhoAtual = [novoItemCarrinho];

    // Salva o novo estado limpo (apenas com o item atual) no navegador instantaneamente
    localStorage.setItem("carrinhoLocal", JSON.stringify(carrinhoAtual));

    // Atualiza também a variável global caso ela exista, para manter tudo em sincronia
    if (typeof dadosGlobaisDoSistema !== "undefined" && dadosGlobaisDoSistema.listaCompras) {
        const itemNaRAM = dadosGlobaisDoSistema.listaCompras.find(i => (i.material || "").trim().toLowerCase() === nomeMaterial.trim().toLowerCase());
        if (itemNaRAM) itemNaRAM.status = statusTratado;
    }

    // =========================================================================
    // 3. ATUALIZAÇÃO IMEDIATA DA INTERFACE
    // =========================================================================
    if (elementoHtmlDoItem) {
        elementoHtmlDoItem.remove();
    }
    
    const container = document.getElementById(idContainer);
    if (container && container.children.length === 0) {
        container.innerHTML = msgVazioHtml;
    }

    if (typeof mostrarToast === "function") {
        mostrarToast(`Adicionado ao carrinho!`, "sucesso");
    }

    if (typeof gerarListaDentroDoCarrinho === "function") {
        gerarListaDentroDoCarrinho();
    }

    // =========================================================================
    // 4. BACK-END EM SEGUNDO PLANO (Silencioso)
    // =========================================================================
    fetch(urlWebApp, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            acao: "atualizarStatusMaterial", 
            material: nomeMaterial,
            status: statusTratado
        })
    })
    .then(res => res.json())
    .then(dados => console.log("[Back-end] Sincronizado em segundo plano:", dados))
    .catch(err => console.error("[Back-end] Erro de sincronização em segundo plano:", err));
}


function configurarEnvioFormulario() {
    const btnAdicionar = document.getElementById("btn-adicionar-material");
    
    if (btnAdicionar) {
        btnAdicionar.addEventListener("click", function () {
            const inputMaterial = document.getElementById("input-material");
            const inputPrioridade = document.getElementById("input-prioridade"); 

            const materialValor = inputMaterial.value.trim();
            const prioridadeValor = inputPrioridade.value; 

            // Validação 1: Nome do Material
            if (!materialValor) {
                mostrarToast("Por favor, digite o nome do material.", "erro");
                return; 
            }

            // Validação 2: Seleção da Prioridade
            if (!prioridadeValor) {
                mostrarToast("Por favor, selecione uma prioridade na lista.", "erro");
                return; 
            }
            
            btnAdicionar.disabled = true;
            btnAdicionar.innerText = "Salvando...";

            // Mantém a estrutura 'listas' que você definiu para alinhar com o backend
            const payload = {
                listas: [ 
                    {
                        material: materialValor,
                        prioridade: prioridadeValor,
                        status: "Pendente"
                    }
                ]
            };

            // [COMPATIBILIDADE AJUSTADA]: Envelopamento seguro para no-cors não dar erro de rede
            const formBody = new URLSearchParams();
            formBody.append("payload", JSON.stringify(payload));

            fetch(urlWebApp, {
                method: "POST",
                mode: "no-cors", 
                headers: { 
                    "Content-Type": "application/x-www-form-urlencoded" 
                },
                body: formBody
            })
            .then(() => {
                mostrarToast("Material enviado com sucesso para a planilha!", "sucesso");
                
                inputMaterial.value = "";
                inputPrioridade.value = "";

                // Recarrega a lista de pendentes para exibir o novo item na tela
                carregarMateriaisPendentes();
            })
            .catch(erro => {
                console.error("Erro ao salvar material:", erro);
                mostrarToast("Erro ao conectar com o servidor.", "erro");
            })
            .finally(() => {
                btnAdicionar.disabled = false;
                btnAdicionar.innerText = "Adicionar à Lista";
            });
        });
    }
}
// ===========================
// INICIAR
// ===========================

renderHistorico();
renderFuncionarios();
renderHistoricoPontos();
renderArmarios();
atualizarContadorLocal()


