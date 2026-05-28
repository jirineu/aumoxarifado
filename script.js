let historico =
    JSON.parse(localStorage.getItem("historico")) || [];

let idExtravio = null;

function salvarDados(){

    localStorage.setItem(
        "historico",
        JSON.stringify(historico)
    );

    // FUTURO GOOGLE APPS SCRIPT
    /*
    fetch("URL_APPS_SCRIPT",{
        method:"POST",
        body: JSON.stringify(historico)
    });
    */

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
                        ✔ CHECKED
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

    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(18);

    doc.text(
        "Relatório - Bruna Construções",
        20,
        y
    );

    y += 15;

    historico.forEach(item => {

        doc.setFontSize(12);

        doc.text(
            `Material: ${item.material}`,
            20,
            y
        );

        y += 8;

        doc.text(
            `Quantidade: ${item.quantidade}`,
            20,
            y
        );

        y += 8;

        doc.text(
            `Funcionário: ${item.funcionario}`,
            20,
            y
        );

        y += 8;

        doc.text(
            `Data: ${formatarData(item.data)}`,
            20,
            y
        );

        y += 8;

        doc.text(
            `Horário: ${item.horario}`,
            20,
            y
        );

        y += 8;

        doc.text(
            `Status: ${item.status}`,
            20,
            y
        );

        y += 15;

        if(y > 260){

            doc.addPage();

            y = 20;
        }

    });

    doc.save("relatorio-material.pdf");
}

renderHistorico();