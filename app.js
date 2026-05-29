// ========================================
// HISTÓRICO LOCAL STORAGE
// ========================================

let historico =
JSON.parse(localStorage.getItem("historico")) || [];

let idExtravio = null;

// ========================================
// URL GOOGLE APPS SCRIPT
// DEIXE VAZIO POR ENQUANTO
// ========================================

const URL_APPS_SCRIPT = "";

// ========================================
// SALVAR LOCAL STORAGE
// ========================================

function salvarLocal(){

    localStorage.setItem(
        "historico",
        JSON.stringify(historico)
    );

}

// ========================================
// SALVAR GOOGLE PLANILHA
// ========================================

async function salvarDados(dados){

    // salva local primeiro
    salvarLocal();

    // se não tiver URL
    // apenas salva local
    if(URL_APPS_SCRIPT === ""){
        console.log("Salvo apenas localStorage");
        return;
    }

    try{

        const resposta = await fetch(
            URL_APPS_SCRIPT,
            {
                method: "POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body: JSON.stringify(dados)
            }
        );

        const resultado =
        await resposta.json();

        if(resultado.sucesso){

            console.log(
                "Salvo na planilha!"
            );

        }else{

            console.error(
                "Erro Apps Script:",
                resultado.erro
            );

        }

    }catch(erro){

        console.error(
            "Erro ao salvar:",
            erro
        );

    }

}

// ========================================
// REGISTRAR SAÍDA
// ========================================

function registrarSaida(){

    const material =
    document.getElementById("material").value;

    const quantidade =
    document.getElementById("quantidade").value;

    const funcionario =
    document.getElementById("funcionario").value;

    if(
        material === "" ||
        quantidade === "" ||
        funcionario === ""
    ){

        alert("Preencha todos os campos.");
        return;

    }

    const agora = new Date();

    const data =
    agora.toISOString().split("T")[0];

    const horario =
    agora.toLocaleTimeString("pt-BR");

    const novoRegistro = {

        id: Date.now(),

        material,

        quantidade,

        funcionario,

        data,

        horario,

        status: "pendente",

        motivo: ""

    };

    historico.unshift(novoRegistro);

    // SALVA LOCAL + PLANILHA
    salvarDados(novoRegistro);

    renderHistorico();

    limparCampos();

}

// ========================================
// LIMPAR CAMPOS
// ========================================

function limparCampos(){

    document.getElementById("material").value = "";

    document.getElementById("quantidade").value = "";

    document.getElementById("funcionario").value = "";

}

// ========================================
// RENDER HISTÓRICO
// ========================================

function renderHistorico(lista = null){

    const historicoDiv =
    document.getElementById("historico");

    historicoDiv.innerHTML = "";

    const dados =
    lista || filtrarDiaAtual();

    if(dados.length === 0){

        historicoDiv.innerHTML =
        "<p>Nenhum registro encontrado.</p>";

        return;

    }

    dados.forEach(item => {

        historicoDiv.innerHTML += `

        <div class="item-historico">

            <h3>${item.material}</h3>

            <p>
                <strong>Quantidade:</strong>
                ${item.quantidade}
            </p>

            <p>
                <strong>Funcionário:</strong>
                ${item.funcionario}
            </p>

            <p>
                <strong>Data:</strong>
                ${formatarData(item.data)}
            </p>

            <p>
                <strong>Horário:</strong>
                ${item.horario}
            </p>

            ${
                item.status === "devolvido"

                ?

                `
                <div class="status-devolvido">
                    ✔ Material devolvido/usado
                </div>
                `

                :

                item.status === "extraviado"

                ?

                `
                <div class="status-extraviado">
                    ✖ EXTRAVIADO
                </div>

                <div class="motivo">
                    <strong>Motivo:</strong>
                    ${item.motivo}
                </div>
                `

                :

                `
                <div class="acoes">

                    <button
                        class="btn-check"
                        onclick="marcarDevolvido(${item.id})"
                    >
                        ✔
                    </button>

                    <button
                        class="btn-x"
                        onclick="abrirExtravio(${item.id})"
                    >
                        ✖
                    </button>

                </div>
                `
            }

        </div>

        `;

    });

}

// ========================================
// FILTRAR DIA
// ========================================

function filtrarDiaAtual(){

    const hoje =
    new Date().toISOString().split("T")[0];

    return historico.filter(item =>
        item.data === hoje
    );

}

// ========================================
// MARCAR DEVOLVIDO
// ========================================

function marcarDevolvido(id){

    const item =
    historico.find(i => i.id === id);

    if(!item) return;

    item.status = "devolvido";

    salvarDados(item);

    renderHistorico();

}

// ========================================
// ABRIR EXTRAVIO
// ========================================

function abrirExtravio(id){

    idExtravio = id;

    document.getElementById(
        "popupExtravio"
    ).style.display = "flex";

}

// ========================================
// CONFIRMAR EXTRAVIO
// ========================================

function confirmarExtravio(){

    const motivo =
    document.getElementById(
        "motivoExtravio"
    ).value;

    if(motivo === ""){

        alert("Digite o motivo.");
        return;

    }

    const item =
    historico.find(i => i.id === idExtravio);

    if(!item) return;

    item.status = "extraviado";

    item.motivo = motivo;

    salvarDados(item);

    document.getElementById(
        "popupExtravio"
    ).style.display = "none";

    document.getElementById(
        "motivoExtravio"
    ).value = "";

    renderHistorico();

}

// ========================================
// FORMATAR DATA
// ========================================

function formatarData(data){

    const partes = data.split("-");

    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}

// ========================================
// INICIAR
// ========================================

renderHistorico();

function testeLocalStorage(){

    const teste = {
        nome: "Teste",
        data: new Date().toLocaleString()
    };

    localStorage.setItem(
        "teste",
        JSON.stringify(teste)
    );

    const retorno =
        JSON.parse(
            localStorage.getItem("teste")
        );

    console.log(retorno);

    alert(
        "LocalStorage funcionando!\n\n" +
        JSON.stringify(retorno)
    );
}
