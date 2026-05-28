

let historico = JSON.parse(localStorage.getItem("historicoMateriais")) || [];

function adicionarRegistro(){

  const material = document.getElementById("material").value;
  const quantidade = document.getElementById("quantidade").value;

  if(material === "" || quantidade === ""){
    alert("Preencha todos os campos.");
    return;
  }

  const agora = new Date();

  const registro = {
    material: material,
    quantidade: quantidade,
    data: agora.toLocaleDateString("pt-BR"),
    horario: agora.toLocaleTimeString("pt-BR")
  };

  historico.push(registro);

  localStorage.setItem(
    "historicoMateriais",
    JSON.stringify(historico)
  );

  document.getElementById("material").value = "";
  document.getElementById("quantidade").value = "";

  renderizarHistorico(historico);
}

function renderizarHistorico(lista){

  const historicoDiv = document.getElementById("historico");

  historicoDiv.innerHTML = "";

  if(lista.length === 0){
    historicoDiv.innerHTML = "<p>Nenhum registro encontrado.</p>";
    return;
  }

  lista.forEach(item => {

    historicoDiv.innerHTML += `
      <div class="card">
        <h3>${item.material}</h3>
        <p><strong>Quantidade:</strong> ${item.quantidade}</p>
        <p><strong>Data:</strong> ${item.data}</p>
        <p><strong>Horário:</strong> ${item.horario}</p>
      </div>
    `;
  });

}

function filtrarHistorico(){

  const dataInicio = document.getElementById("dataInicio").value;
  const dataFim = document.getElementById("dataFim").value;

  if(dataInicio === "" || dataFim === ""){
    renderizarHistorico(historico);
    return;
  }

  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  const filtrados = historico.filter(item => {

    const partes = item.data.split("/");
    const dataRegistro = new Date(
      `${partes[2]}-${partes[1]}-${partes[0]}`
    );

    return dataRegistro >= inicio && dataRegistro <= fim;
  });

  renderizarHistorico(filtrados);
}

function gerarPDF(){

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Bruna Construções", 20, 20);

  doc.setFontSize(14);
  doc.text("Relatório de Saída de Material", 20, 30);

  let y = 45;

  historico.forEach((item, index) => {

    doc.setFontSize(12);

    doc.text(
      `${index + 1}. Material: ${item.material}`,
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
      `Data: ${item.data} | Horário: ${item.horario}`,
      20,
      y
    );

    y += 15;

    if(y > 270){
      doc.addPage();
      y = 20;
    }

  });

  doc.save("relatorio-materiais.pdf");
}

renderizarHistorico(historico);
