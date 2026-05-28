// ========================================
// HISTÓRICO LOCAL
// ========================================

let historico = [];

try{

    historico =
        JSON.parse(
            localStorage.getItem("historico")
        ) || [];

}catch{

    historico = [];
}

let idExtravio = null;

// ========================================
// URL APPS SCRIPT
// ========================================
// DEIXE VAZIO POR ENQUANTO
// QUANDO CONECTAR PLANILHA,
// COLE A URL DO WEB APP
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
// SALVAR PLANILHA
// ========================================

async function salvarDados(dados){

    // SE NÃO TIVER URL
    // NÃO ENVIA PARA PLANILHA

    if(URL_APPS_SCRIPT === ""){
        return;
    }

    try{

        const resposta = await fetch(
            URL_APPS_SCRIPT,
            {

                method: "POST",

                headers: {
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

    // SALVA LOCAL

    salvarLocal();

    // SALVA PLANILHA

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
                        ${item.motivo || "-"}
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
// FILTRAR DIA ATUAL
// ========================================

function filtrarDiaAtual(){

    const hoje =
        new Date().toISOString().split("T")[0];

    return historico.filter(item =>
        item.data === hoje
    );
}

// ========================================
// POPUP FILTRO
// ========================================

function abrirFiltro(){

    document.getElementById(
        "popupFiltro"
    ).style.display = "flex";
}

function fecharFiltro(){

    document.getElementById(
        "popupFiltro"
    ).style.display = "none";
}

// ========================================
// FILTRAR HISTÓRICO
// ========================================

function filtrarHistorico(){

    const inicio =
        document.getElementById(
            "dataInicial"
        ).value;

    const fim =
        document.getElementById(
            "dataFinal"
        ).value;

    if(inicio === "" || fim === ""){

        alert("Selecione as datas.");

        return;
    }

    const filtrado =
        historico.filter(item => {

            return item.data >= inicio &&
                   item.data <= fim;

        });

    renderHistorico(filtrado);

    fecharFiltro();
}

// ========================================
// MATERIAL DEVOLVIDO
// ========================================

function marcarDevolvido(id){

    const item =
        historico.find(i => i.id === id);

    if(!item){
        return;
    }

    item.status = "devolvido";

    salvarLocal();

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

    if(!item){
        return;
    }

    item.status = "extraviado";

    item.motivo = motivo;

    salvarLocal();

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
// GERAR PDF
// ========================================

function gerarPDF(){

    const { jsPDF } = window.jspdf;

    const doc =
        new jsPDF("p", "mm", "a4");

    doc.setFontSize(18);

    doc.text(
        "Bruna Construções",
        105,
        15,
        { align: "center" }
    );

    doc.setFontSize(12);

    doc.text(
        "Controle de Saída de Material",
        105,
        23,
        { align: "center" }
    );

    let y = 35;

    const colunas = {

        material: 10,

        quantidade: 50,

        funcionario: 70,

        data: 120,

        horario: 145,

        status: 170
    };

    const alturaLinha = 10;

    function desenharCabecalho(){

        doc.setFillColor(15,92,122);

        doc.rect(
            10,
            y,
            190,
            alturaLinha,
            "F"
        );

        doc.setTextColor(255,255,255);

        doc.setFontSize(10);

        doc.text(
            "Material",
            colunas.material + 2,
            y + 7
        );

        doc.text(
            "Qtd",
            colunas.quantidade + 2,
            y + 7
        );

        doc.text(
            "Funcionário",
            colunas.funcionario + 2,
            y + 7
        );

        doc.text(
            "Data",
            colunas.data + 2,
            y + 7
        );

        doc.text(
            "Hora",
            colunas.horario + 2,
            y + 7
        );

        doc.text(
            "Status",
            colunas.status + 2,
            y + 7
        );

        y += alturaLinha;

        doc.setTextColor(0,0,0);
    }

    desenharCabecalho();

    historico.forEach((item, index) => {

        if(y > 270){

            doc.addPage();

            y = 20;

            desenharCabecalho();
        }

        if(index % 2 === 0){

            doc.setFillColor(245,245,245);

            doc.rect(
                10,
                y,
                190,
                alturaLinha,
                "F"
            );
        }

        doc.rect(
            10,
            y,
            190,
            alturaLinha
        );

        doc.setFontSize(9);

        doc.text(
            String(item.material),
            colunas.material + 2,
            y + 7
        );

        doc.text(
            String(item.quantidade),
            colunas.quantidade + 2,
            y + 7
        );

        doc.text(
            String(item.funcionario),
            colunas.funcionario + 2,
            y + 7
        );

        doc.text(
            formatarData(item.data),
            colunas.data + 2,
            y + 7
        );

        doc.text(
            String(item.horario),
            colunas.horario + 2,
            y + 7
        );

        doc.text(
            String(item.status),
            colunas.status + 2,
            y + 7
        );

        y += alturaLinha;

        if(item.status === "extraviado"){

            doc.setFontSize(8);

            doc.setTextColor(180,0,0);

            doc.text(
                `Motivo: ${item.motivo || "-"}`,
                15,
                y + 5
            );

            doc.setTextColor(0,0,0);

            y += 10;
        }

    });

    doc.setFontSize(9);

    doc.text(
        `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
        10,
        290
    );

    doc.save("relatorio-material.pdf");
}

// ========================================
// INICIAR
// ========================================

renderHistorico();