// ===========================
// STORAGE
// ===========================

let historico =
JSON.parse(localStorage.getItem("historico")) || [];

let funcionarios =
JSON.parse(localStorage.getItem("funcionarios")) || [];

let pontos =
JSON.parse(localStorage.getItem("pontos")) || [];

let armarios =
JSON.parse(localStorage.getItem("armarios")) || [];

// ===========================
// CRIAR ARMÁRIOS
// ===========================

if(armarios.length === 0){

    for(let i = 1; i <= 60; i++){

        armarios.push({
            numero:i,
            funcionario:null
        });

    }

    salvarTudo();

}

// ===========================
// SALVAR
// ===========================




let timeoutSalvar = null;

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
                        armarios

                    })

                }

            );

            console.log(
                "Dados enviados para planilha"
            );

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

        div.innerHTML += `

        <div class="historico-item">

            <strong>${item.material}</strong>

            <p>Qtd: ${item.quantidade}</p>

            <p>${item.funcionario}</p>

            <p>${item.data}</p>

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

    const horario =
    document.getElementById("horarioFuncionario").value;

    if(!nome || !funcao || !horario){
        return;
    }

    funcionarios.push({
        id:Date.now(),
        nome,
        funcao,
        horario
    });

    salvarTudo();

    renderFuncionarios();

}

function funcionarioBateuHoje(id){

    const hoje =
    new Date().toLocaleDateString("pt-BR");

    return pontos.some(p =>

        p.funcionarioId === id &&
        p.data === hoje

    );

}

function renderFuncionarios(lista = funcionarios){

    const div =
    document.getElementById("listaFuncionarios");

    div.innerHTML = "";

    lista.forEach(funcionario => {

        const bateu =
        funcionarioBateuHoje(funcionario.id);

        div.innerHTML += `

        <div class="
            funcionario
            ${bateu ? 'verde' : 'vermelho'}
        ">

            <strong>${funcionario.nome}</strong>

            <p>${funcionario.funcao}</p>

            <p>${funcionario.horario}</p>

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

    const funcionario =
    funcionarios.find(f => f.id === id);

    if(!funcionario) return;

    const nome =
    prompt("Nome", funcionario.nome);

    const funcao =
    prompt("Função", funcionario.funcao);

    const horario =
    prompt("Horário", funcionario.horario);

    funcionario.nome = nome;
    funcionario.funcao = funcao;
    funcionario.horario = horario;

    salvarTudo();

    renderFuncionarios();

}

// ===========================
// BATER PONTO
// ===========================

function baterPonto(id){

    const hoje =
    new Date().toLocaleDateString("pt-BR");

    const horario =
    new Date().toLocaleTimeString(
        "pt-BR",
        {
            hour:"2-digit",
            minute:"2-digit"
        }
    );

    let registro =
    pontos.find(p =>

        p.funcionarioId === id &&
        p.data === hoje

    );

    // PRIMEIRA BATIDA = ENTRADA

    if(!registro){

        pontos.unshift({

            funcionarioId:id,

            data:hoje,

            entrada:horario,

            saida:""

        });

    }

    // SEGUNDA BATIDA = SAÍDA

    else if(!registro.saida){

        registro.saida = horario;

    }

    // SE JÁ TIVER ENTRADA E SAÍDA
    // NÃO FAZ NADA

    else{

        return alert(
            "Ponto deste funcionário já finalizado hoje."
        );

    }

    salvarTudo();

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

    const filtro =
    document.getElementById("filtroPonto").value;

    pontos.forEach(ponto => {

        if(filtro){

            const dataFiltro =
            new Date(filtro)
            .toLocaleDateString();

            if(ponto.data !== dataFiltro){
                return;
            }

        }

        const funcionario =
        funcionarios.find(f =>
            f.id === ponto.funcionarioId
        );

        if(!funcionario) return;

        div.innerHTML += `

        <div class="historico-item">

            <strong>${funcionario.nome}</strong>

            <p>${funcionario.funcao}</p>

            <p>Entrada: ${ponto.entrada}</p>

            <p>Saída: ${ponto.saida || '--'}</p>

            <p>${ponto.data}</p>

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

function renderArmarios(){

    const div =
    document.getElementById("gradeArmarios");

    div.innerHTML = "";

    armarios.forEach(armario => {

        div.innerHTML += `

        <div
            class="
                armario
                ${armario.funcionario ? 'ocupado' : 'livre'}
            "
            onclick="abrirArmario(${armario.numero})"
        >

            ${armario.numero}

        </div>

        `;

    });

}

function abrirArmario(numero){

    armarioAtual = numero;

    const armario =
    armarios.find(a => a.numero === numero);

    document.getElementById(
        "popupArmario"
    ).style.display = "flex";

    document.getElementById(
        "infoArmario"
    ).innerHTML =

    armario.funcionario

    ?

    `Pertence a ${armario.funcionario}`

    :

    `Armário vazio`;

    const select =
    document.getElementById(
        "selectFuncionario"
    );

    select.innerHTML = "";

    funcionarios.forEach(f => {

        select.innerHTML += `
            <option value="${f.nome}">
                ${f.nome}
            </option>
        `;

    });

}

function vincularArmario(){

    const funcionario =
    document.getElementById(
        "selectFuncionario"
    ).value;

    const armario =
    armarios.find(a =>
        a.numero === armarioAtual
    );

    armario.funcionario =
    funcionario;

    salvarTudo();

    fecharPopup();

    renderArmarios();

}

function fecharPopup(){

    document.getElementById(
        "popupArmario"
    ).style.display = "none";

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

// ===========================
// INICIAR
// ===========================

renderHistorico();
renderFuncionarios();
renderHistoricoPontos();
renderArmarios();

