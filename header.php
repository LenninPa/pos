<?php 
date_default_timezone_set('America/El_Salvador'); // Zona horaria
$dia = date("d");
$mes = date("m") - 1; // JavaScript usa meses de 0 a 11
$anio = date("Y");
$hora = date("H");
$min = date("i");
$seg = date("s");
$user = "Admin";
?>
<div class="header" id="header">
	<div class="header_nav">
		<button class="header_nav_bttns"><a href="#"> Ventas </a></button>
		<button class="header_nav_bttns"><a href="#"> Productos </a></button>
		<button class="header_nav_bttns"><a href="#"> Inventarios </a></button>
		<button class="header_nav_bttns"><a href="#"> Gestion Clientes </a></button>
		<button class="header_nav_bttns"><a href="#"> Listas </a></button>
		<button class="header_nav_bttns"><a href="#"> Cuadre Caja </a></button>
		<button class="header_nav_bttns"><a href="#"> Configuracion</a></button>
	</div>
	<div class="utilities">
		<h1 class="user"><?php echo "Hola&nbsp;$user"; ?></h1>
		<h1 class="time"><span id="reloj"></span></h1>
		<button class="header_nav_bttns"><a href="#">Salir</a></button>
	</div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    let hora = new Date(<?php echo "$anio, $mes, $dia, $hora, $min, $seg"; ?>);

    function actualizarReloj() {
        hora.setSeconds(hora.getSeconds() + 1);
        const dia = hora.getDate().toString().padStart(2, '0');
        const mes = (hora.getMonth() + 1).toString().padStart(2, '0'); // +1 porque JS inicia en 0
        const anio = hora.getFullYear();
        const horas = hora.getHours().toString().padStart(2, '0');
        const minutos = hora.getMinutes().toString().padStart(2, '0');
        const segundos = hora.getSeconds().toString().padStart(2, '0');
        const texto = `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
        document.getElementById('reloj').textContent = texto;
    }

    actualizarReloj();
    setInterval(actualizarReloj, 1000);
});
</script>
