let historico =
    JSON.parse(localStorage.getItem("historico")) || [];

let idExtravio = null;

const URL_APPS_SCRIPT =
    "https://script.google.com/macros/s/AKfycbxSXMxe0Q4J1rrP9sMcVyL5Q2YzXrUlXMJPDcuW8Gpgb6RAsi1Bxl9fJ48nZc_-tiHXgw/exec";

async function salvarDados(dados){

    try{

        await fetch(URL_APPS_SCRIPT, {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(dados)

        });

        console.log("Salvo na planilha");

    }catch(erro){

        console.error(
            "Erro ao salvar:",
            erro
        );

    }

}

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

    salvarDados();

    renderHistorico();

    limparCampos();
}

function limparCampos(){

    document.getElementById("material").value = "";
    document.getElementById("quantidade").value = "";
    document.getElementById("funcionario").value = "";

}

function renderHistorico(lista = null){

    const historicoDiv =
        document.getElementById("historico");

    historicoDiv.innerHTML = "";

    const dados = lista || filtrarDiaAtual();

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

function filtrarDiaAtual(){

    const hoje =
        new Date().toISOString().split("T")[0];

    return historico.filter(item =>
        item.data === hoje
    );
}

function abrirFiltro(){

    document.getElementById("popupFiltro")
        .style.display = "flex";
}

function fecharFiltro(){

    document.getElementById("popupFiltro")
        .style.display = "none";
}

function filtrarHistorico(){

    const inicio =
        document.getElementById("dataInicial").value;

    const fim =
        document.getElementById("dataFinal").value;

    if(inicio === "" || fim === ""){
        alert("Selecione as datas.");
        return;
    }

    const filtrado = historico.filter(item => {

        return item.data >= inicio &&
               item.data <= fim;

    });

    renderHistorico(filtrado);

    fecharFiltro();
}

function marcarDevolvido(id){

    const item =
        historico.find(i => i.id === id);

    item.status = "devolvido";

    salvarDados();

    renderHistorico();
}

function abrirExtravio(id){

    idExtravio = id;

    document.getElementById("popupExtravio")
        .style.display = "flex";
}

function confirmarExtravio(){

    const motivo =
        document.getElementById("motivoExtravio").value;

    if(motivo === ""){
        alert("Digite o motivo.");
        return;
    }

    const item =
        historico.find(i => i.id === idExtravio);

    item.status = "extraviado";

    item.motivo = motivo;

    salvarDados();

    document.getElementById("popupExtravio")
        .style.display = "none";

    document.getElementById("motivoExtravio").value = "";

    renderHistorico();
}

function formatarData(data){

    const partes = data.split("-");

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function gerarPDF(){

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF("p", "mm", "a4");

    // =====================================
    // TÍTULO
    // =====================================

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

    // =====================================
    // CONFIGURAÇÃO TABELA
    // =====================================

    let y = 35;

    const colunas = {
        material: 10,
        quantidade: 55,
        funcionario: 80,
        data: 130,
        horario: 155,
        status: 180
    };

    // ALTURA LINHA
    const alturaLinha = 10;

    // =====================================
    // CABEÇALHO
    // =====================================

    function desenharCabecalho(){

        doc.setFillColor(15, 92, 122);

        doc.rect(10, y, 190, alturaLinha, "F");

        doc.setTextColor(255,255,255);

        doc.setFontSize(10);

        doc.text("Material", colunas.material + 2, y + 7);

        doc.text("Qtd", colunas.quantidade + 2, y + 7);

        doc.text("Funcionário", colunas.funcionario + 2, y + 7);

        doc.text("Data", colunas.data + 2, y + 7);

        doc.text("Hora", colunas.horario + 2, y + 7);

        doc.text("Status", colunas.status + 2, y + 7);

        y += alturaLinha;

        doc.setTextColor(0,0,0);
    }

    desenharCabecalho();

    // =====================================
    // LINHAS
    // =====================================

    historico.forEach((item, index) => {

        // QUEBRA DE PÁGINA

        if(y > 270){

            doc.addPage();

            y = 20;

            desenharCabecalho();
        }

        // FUNDO ZEBRADO

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

        // BORDA

        doc.rect(
            10,
            y,
            190,
            alturaLinha
        );

        // TEXTO

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

        // =====================================
        // MOTIVO EXTRAVIO
        // =====================================

        if(item.status === "extraviado"){

            doc.setFontSize(8);

            doc.setTextColor(180,0,0);

            doc.text(
                `Motivo: ${item.motivo}`,
                15,
                y + 5
            );

            doc.setTextColor(0,0,0);

            y += 10;
        }

    });

    // =====================================
    // RODAPÉ
    // =====================================

    doc.setFontSize(9);

    doc.text(
        `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
        10,
        290
    );

    // =====================================
    // SALVAR PDF
    // =====================================

    doc.save("relatorio-material.pdf");
}

renderHistorico();