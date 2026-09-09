const $ = id => document.getElementById(id);

let equipos = JSON.parse(
    localStorage.getItem("gastroEquipos") || "[]"
);

let cuenta = JSON.parse(
    localStorage.getItem("gastroCuenta") || "null"
);

let configuracion = JSON.parse(
    localStorage.getItem("gastroConfig") ||
    '{"tarifa":2.00,"restaurante":""}'
);

let historico = JSON.parse(
    localStorage.getItem("gastroHistorico") || "{}"
);


/* FUNCIONES GENERALES */

function money(n){
    return "Bs " + Number(n)
        .toFixed(2)
        .replace(".", ",");
}


function monthKey(date = new Date()){

    return date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0");

}


function monthName(date = new Date()){

    return date.toLocaleDateString(
        "es-BO",
        {
            month:"long",
            year:"numeric"
        }
    );

}


function previousMonthDate(){

    const d = new Date();

    d.setDate(1);

    d.setMonth(d.getMonth() - 1);

    return d;

}


/* CALCULAR CONSUMO DE EQUIPO */

function calcEquipo(e){

    return Number(e.potencia) *
        Number(e.horas) *
        Number(e.dias) / 1000;

}


/* CONSUMO TOTAL */

function totalActual(){

    return equipos.reduce(
        (s, e) => s + calcEquipo(e),
        0
    );

}


/* GUARDAR HISTORIAL */

function ensureHistory(){

    const key = monthKey();

    const total = totalActual();

    if(!historico[key]){
        historico[key] = 0;
    }

    historico[key] = total;

    localStorage.setItem(
        "gastroHistorico",
        JSON.stringify(historico)
    );

}


/* CAMBIAR SECCIONES */

function showSection(id){

    document
        .querySelectorAll(".section")
        .forEach(s => s.classList.remove("active"));

    $(id).classList.add("active");


    document
        .querySelectorAll(".nav-btn[data-section]")
        .forEach(b =>
            b.classList.toggle(
                "active",
                b.dataset.section === id
            )
        );

}


/* BOTONES DEL MENU */

document
    .querySelectorAll(".nav-btn[data-section]")
    .forEach(btn =>
        btn.addEventListener(
            "click",
            () => showSection(btn.dataset.section)
        )
    );


/* MOSTRAR Y OCULTAR CONTRASEÑA */

$("togglePassword").addEventListener("click", () => {

    const input = $("regPassword");

    const icon =
        $("togglePassword").querySelector("i");


    if(input.type === "password"){

        input.type = "text";

        icon.className =
            "fa-solid fa-eye-slash";

        $("togglePassword").setAttribute(
            "aria-label",
            "Ocultar contraseña"
        );

    }else{

        input.type = "password";

        icon.className =
            "fa-solid fa-eye";

        $("togglePassword").setAttribute(
            "aria-label",
            "Mostrar contraseña"
        );

    }

});


/* REGISTRO DE CUENTA */

$("registerForm").addEventListener("submit", e => {

    e.preventDefault();


    cuenta = {

        nombre:
            $("regNombre").value.trim(),

        restaurante:
            $("regRestaurante").value.trim(),

        email:
            $("regEmail").value.trim()

    };


    localStorage.setItem(
        "gastroCuenta",
        JSON.stringify(cuenta)
    );


    configuracion.restaurante =
        cuenta.restaurante;


    localStorage.setItem(
        "gastroConfig",
        JSON.stringify(configuracion)
    );


    $("loginScreen")
        .classList.add("hidden");


    $("dashboard")
        .classList.remove("hidden");


    loadApp();

});


/* CARGAR APLICACION */

function loadApp(){

    $("welcomeName").textContent =
        cuenta?.nombre || "usuario";


    $("userInfoNombre").textContent =
        cuenta?.nombre || "";


    $("userInfoEmail").textContent =
        cuenta?.email || "";


    $("userInfoRestaurante").textContent =
        configuracion.restaurante ||
        cuenta?.restaurante ||
        "";


    $("configRestaurante").value =
        configuracion.restaurante ||
        cuenta?.restaurante ||
        "";


    $("tarifa").value =
        configuracion.tarifa ?? 2;


    ensureHistory();

    renderAll();

}


/* CERRAR SESION */

$("logoutBtn").addEventListener("click", () => {

    $("dashboard")
        .classList.add("hidden");


    $("loginScreen")
        .classList.remove("hidden");

});


/* ABRIR MODAL */

$("addEquipoBtn").addEventListener(
    "click",
    () => $("equipoModal").classList.add("show")
);


/* CERRAR MODAL */

$("closeModal").addEventListener(
    "click",
    () => $("equipoModal").classList.remove("show")
);


/* CERRAR AL HACER CLICK FUERA */

$("equipoModal").addEventListener(
    "click",
    e => {

        if(e.target === $("equipoModal")){

            $("equipoModal")
                .classList.remove("show");

        }

    }
);


/* AGREGAR EQUIPO */

$("equipoForm").addEventListener(
    "submit",
    e => {

        e.preventDefault();


        equipos.push({

            id:Date.now(),

            nombre:
                $("eqNombre").value.trim(),

            potencia:
                Number($("eqPotencia").value),

            horas:
                Number($("eqHoras").value),

            dias:
                Number($("eqDias").value)

        });


        localStorage.setItem(
            "gastroEquipos",
            JSON.stringify(equipos)
        );


        $("equipoForm").reset();


        $("equipoModal")
            .classList.remove("show");


        ensureHistory();

        renderAll();

    }
);


/* MOSTRAR EQUIPOS */

function renderEquipos(){

    const t = $("equiposTable");

    t.innerHTML = "";


    equipos.forEach((e, i) => {

        const kwh = calcEquipo(e);

        const costo =
            kwh * Number(configuracion.tarifa || 0);


        let estado =
            kwh >= 150
            ? "Alto"
            : kwh >= 80
            ? "Moderado"
            : "Normal";


        let cls =
            estado === "Alto"
            ? "red"
            : estado === "Moderado"
            ? "yellow"
            : "green";


        t.innerHTML += `

            <tr>

                <td>${escapeHtml(e.nombre)}</td>

                <td>${e.potencia} W</td>

                <td>
                    ${e.horas} h/día ·
                    ${e.dias} días
                </td>

                <td>
                    ${kwh.toFixed(2)} kWh
                </td>

                <td>
                    ${money(costo)}
                </td>

                <td>
                    <span class="badge ${cls}">
                        ${estado}
                    </span>
                </td>

                <td>
                    <button
                        class="action-btn"
                        data-delete="${i}">
                        Eliminar
                    </button>
                </td>

            </tr>

        `;

    });


    t.querySelectorAll("[data-delete]")
        .forEach(b =>

            b.addEventListener("click", () => {

                equipos.splice(
                    Number(b.dataset.delete),
                    1
                );


                localStorage.setItem(
                    "gastroEquipos",
                    JSON.stringify(equipos)
                );


                ensureHistory();

                renderAll();

            })

        );

}


/* DASHBOARD */

function renderDashboard(){

    const total = totalActual();

    const costo =
        total * Number(configuracion.tarifa || 0);


    const prev =
        Number(
            historico[
                monthKey(previousMonthDate())
            ] || 0
        );


    const variation =
        prev
        ? ((total - prev) / prev) * 100
        : 0;


    $("totalConsumo").textContent =
        total.toFixed(2) + " kWh";


    $("cantidadEquipos").textContent =
        equipos.length;


    $("costoTotal").textContent =
        money(costo);


    $("variacionInicio").textContent =
        (variation >= 0 ? "+" : "") +
        variation.toFixed(1) +
        " %";


    $("consumoTotalSection").textContent =
        total.toFixed(2) + " kWh";


    const top =
        [...equipos]
        .sort(
            (a, b) =>
                calcEquipo(b) -
                calcEquipo(a)
        )[0];


    $("mayorEquipo").textContent =
        top
        ? top.nombre
        : "Sin datos";


    $("mayorEquipoDetalle").textContent =
        top
        ? calcEquipo(top).toFixed(2) +
            " kWh al mes"
        : "Registra equipos.";


    $("resumenInicio").className =
        top
        ? "notice success"
        : "notice info";


    $("resumenInicio").textContent =
        top
        ? `El equipo con mayor consumo actualmente es ${top.nombre}. Revisa sus horas de uso para identificar oportunidades de ahorro.`
        : "Registra tus equipos para comenzar a obtener información.";

}


/* PARTICIPACION DE CONSUMO */

function renderConsumo(){

    const total = totalActual();

    const box = $("participacion");


    if(!equipos.length){

        box.innerHTML =
            '<p class="muted">No hay equipos registrados.</p>';

        return;

    }


    box.innerHTML =
        [...equipos]
        .sort(
            (a, b) =>
                calcEquipo(b) -
                calcEquipo(a)
        )
        .map(e => {

            const pct =
                total
                ? (calcEquipo(e) / total) * 100
                : 0;


            return `

                <div style="margin:15px 0">

                    <div style="
                        display:flex;
                        justify-content:space-between
                    ">

                        <strong>
                            ${escapeHtml(e.nombre)}
                        </strong>

                        <span>
                            ${pct.toFixed(1)} %
                            ·
                            ${calcEquipo(e).toFixed(2)} kWh
                        </span>

                    </div>

                    <div class="progress">

                        <span
                            style="width:${pct}%">
                        </span>

                    </div>

                </div>

            `;

        })
        .join("");

}


/* REPORTES */

function renderReport(){

    const total = totalActual();

    const prevKey =
        monthKey(previousMonthDate());


    const prev =
        Number(historico[prevKey] || 0);


    const variation =
        prev
        ? ((total - prev) / prev) * 100
        : 0;


    $("reportePeriodo").textContent =
        "Reporte de " + monthName();


    $("repAnterior").textContent =
        prev.toFixed(2) + " kWh";


    $("repActual").textContent =
        total.toFixed(2) + " kWh";


    $("repVariacion").textContent =
        (variation >= 0 ? "+" : "") +
        variation.toFixed(1) +
        " %";


    $("repCosto").textContent =
        money(
            total *
            Number(configuracion.tarifa || 0)
        );


    const max =
        Math.max(prev, total, 1);


    $("barAnterior").style.height =
        Math.max(
            5,
            (prev / max) * 180
        ) + "px";


    $("barActual").style.height =
        Math.max(
            5,
            (total / max) * 180
        ) + "px";


    const ranking =
        $("rankingEquipos");


    const sorted =
        [...equipos]
        .sort(
            (a, b) =>
                calcEquipo(b) -
                calcEquipo(a)
        );


    ranking.innerHTML =
        sorted.length

        ? sorted
            .slice(0, 5)
            .map((e, i) => `

                <div style="margin:13px 0">

                    <div style="
                        display:flex;
                        justify-content:space-between
                    ">

                        <strong>
                            ${i + 1}.
                            ${escapeHtml(e.nombre)}
                        </strong>

                        <span>
                            ${calcEquipo(e).toFixed(2)} kWh
                        </span>

                    </div>


                    <div class="progress">

                        <span style="
                            width:${
                                total
                                ? calcEquipo(e) /
                                  total *
                                  100
                                : 0
                            }%
                        ">
                        </span>

                    </div>

                </div>

            `)
            .join("")

        : '<p class="muted">No hay datos.</p>';


    $("detalleReporte").innerHTML =
        sorted.length

        ? `

            <table>

                <thead>

                    <tr>
                        <th>Equipo</th>
                        <th>Potencia</th>
                        <th>Horas/día</th>
                        <th>Días/mes</th>
                        <th>kWh</th>
                        <th>Costo</th>
                    </tr>

                </thead>


                <tbody>

                    ${sorted.map(e => `

                        <tr>

                            <td>
                                ${escapeHtml(e.nombre)}
                            </td>

                            <td>
                                ${e.potencia} W
                            </td>

                            <td>
                                ${e.horas}
                            </td>

                            <td>
                                ${e.dias}
                            </td>

                            <td>
                                ${calcEquipo(e).toFixed(2)}
                            </td>

                            <td>
                                ${money(
                                    calcEquipo(e) *
                                    Number(
                                        configuracion.tarifa || 0
                                    )
                                )}
                            </td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

        `

        : '<p class="muted">No hay equipos registrados.</p>';

}


/* ALERTAS */

function renderAlerts(){

    const box = $("alertasBox");


    if(!equipos.length){

        box.innerHTML =
            '<div class="notice info">No hay alertas porque todavía no se registraron equipos.</div>';

        return;

    }


    box.innerHTML =
        equipos.map(e => {

            const kwh =
                calcEquipo(e);


            if(kwh >= 150){

                return `

                    <div class="notice danger">

                        ⚠️

                        <strong>
                            ${escapeHtml(e.nombre)}
                        </strong>

                        presenta un consumo alto de
                        ${kwh.toFixed(2)}
                        kWh/mes.

                    </div>

                `;

            }


            if(kwh >= 80){

                return `

                    <div class="notice warning">

                        ⚠️

                        <strong>
                            ${escapeHtml(e.nombre)}
                        </strong>

                        presenta un consumo moderado de
                        ${kwh.toFixed(2)}
                        kWh/mes.

                    </div>

                `;

            }


            return `

                <div class="notice success">

                    ✓

                    <strong>
                        ${escapeHtml(e.nombre)}
                    </strong>

                    presenta un consumo dentro
                    del rango normal.

                </div>

            `;

        })
        .join("");

}


/* ACTUALIZAR TODA LA INTERFAZ */

function renderAll(){

    renderEquipos();

    renderDashboard();

    renderConsumo();

    renderReport();

    renderAlerts();

}


/* GUARDAR CONFIGURACION */

$("saveConfig").addEventListener(
    "click",
    () => {

        configuracion.restaurante =
            $("configRestaurante")
            .value
            .trim();


        configuracion.tarifa =
            Number($("tarifa").value) || 0;


        localStorage.setItem(
            "gastroConfig",
            JSON.stringify(configuracion)
        );


        $("configMsg").innerHTML =
            '<div class="notice success">Configuración guardada correctamente.</div>';


        renderAll();

    }
);


/* DESCARGAR PDF */

$("downloadPdfBtn").addEventListener(
    "click",
    () => {

        showSection("reportes");

        window.print();

    }
);


/* PROTEGER CONTRA CODIGO HTML */

function escapeHtml(text){

    return String(text)
        .replace(
            /[&<>"']/g,
            m => ({
                "&":"&amp;",
                "<":"&lt;",
                ">":"&gt;",
                '"':"&quot;",
                "'":"&#039;"
            }[m])
        );

}


/* VERIFICAR SI YA EXISTE UNA CUENTA */

if(cuenta){

    $("loginScreen")
        .classList.add("hidden");


    $("dashboard")
        .classList.remove("hidden");


    loadApp();

}