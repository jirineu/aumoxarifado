let historico =
JSON.parse(localStorage.getItem("historicoMateriais")) || [];

let indiceExtravio = null;

function adicionarRegistro(){

  const funcionario =
  document.getElementById("funcionario").value;

  const material =
  document.getElementById("material").value;

  const quantidade =
  document.getElementById("quantidade").value;

  if(
    funcionario === "" ||
    material === "" ||
    quantidade === ""
  ){
    alert("Preencha todos os campos.");
    return;
  }

  const agora = new Date();

  const registro = {

    funcionario,
    material,
    quantidade,

    dataISO: agora.toISOString(),

    data:
    agora.toLocaleDateString("pt-BR"),

    horario:
    agora.toLocaleTimeString("pt-BR"),

    status:"pendente",

    motivo:""
  };

  historico.push(registro);

  salvar();

  document.getElementById("funcionario").value = "";
  document.getElementById("material").value = "";
  document.getElementById("quantidade").value = "";

  mostrarHistoricoHoje();
}

function salvar(){

  localStorage.setItem(
    "historicoMateriais",
    JSON.stringify(historico)
  );

}

function mostrarHistoricoHoje(){

  const hoje = new Date();

  const dataHoje =
  hoje.toLocaleDateString("pt-BR");

  const lista =
  historico.filter(item => item.data === dataHoje);

  renderizarHistorico(lista);
}

function renderizarHistorico(lista){

  const div =
  document.getElementById("historico");

  div.innerHTML = "";

  if(lista.length === 0){

    div.innerHTML =
    "<p>Nenhum registro encontrado.</p>";

    return;
  }

  lista.reverse().forEach((item) => {

    const index =
    historico.indexOf(item);

    let statusHTML = "";

    if(item.status === "devolvido"){

      statusHTML = `
        <div class="status devolvido">
          ✔ Material Devolvido
        </div>
      `;
    }

    if(item.status === "extraviado"){

      statusHTML = `
        <div class="status extraviado">
          ✖ Material Extraviado
        </div>

        <div class="motivo">
          <strong>Motivo:</strong>
          ${item.motivo}
        </div>
      `;
    }

    div.innerHTML += `

      <div class="card">

        <h3>${item.material}</h3>

        <p>
          <strong>Funcionário:</strong>
          ${item.funcionario}
        </p>

        <p>
          <strong>Quantidade:</strong>
          ${item.quantidade}
        </p>

        <p>
          <strong>Data:</strong>
          ${item.data}
        </p>

        <p>
          <strong>Horário:</strong>
          ${item.horario}
        </p>

        ${
          item.status === "pendente"
          ?

          `
          <div class="acoes">

            <button
              class="btn-check"
              onclick="marcarDevolvido(${index})"
            >
              ✔
            </button>

            <button
              class="btn-x"
              onclick="abrirExtravio(${index})"
            >
              ✖
            </button>

          </div>
          `
          :

          statusHTML
        }

      </div>

    `;
  });

}

function marcarDevolvido(index){

  historico[index].status = "devolvido";

  salvar();

  mostrarHistoricoHoje();
}

function abrirExtravio(index){

  indiceExtravio = index;

  document.getElementById("modalExtravio")
  .style.display = "flex";
}

function confirmarExtravio(){

  const motivo =
  document.getElementById("motivoExtravio").value;

  if(motivo === ""){

    alert("Explique o motivo.");
    return;
  }

  historico[indiceExtravio].status =
  "extraviado";

  historico[indiceExtravio].motivo =
  motivo;

  salvar();

  document.getElementById("motivoExtravio")
  .value = "";

  document.getElementById("modalExtravio")
  .style.display = "none";

  mostrarHistoricoHoje();
}

function abrirFiltro(){

  document.getElementById("modalFiltro")
  .style.display = "flex";
}

function fecharFiltro(){

  document.getElementById("modalFiltro")
  .style.display = "none";

  mostrarHistoricoHoje();
}

function filtrarHistorico(){

  const inicio =
  document.getElementById("dataInicio").value;

  const fim =
  document.getElementById("dataFim").value;

  if(inicio === "" || fim === ""){

    mostrarHistoricoHoje();

    return;
  }

  const lista = historico.filter(item => {

    const data =
    new Date(item.dataISO);

    return data >= new Date(inicio)
    &&
    data <= new Date(fim + "T23:59:59");
  });

  renderizarHistorico(lista);

  fecharFiltro();
}

mostrarHistoricoHoje();
