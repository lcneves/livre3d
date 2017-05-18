var html = '<surface id="surface" class="surface-1">    <div>    <h2 meta-text="oi">      Oi! Este é um texto!    </h2>    <img scr="/img/example.png" />    <p>Sem espaço!</p></div>     </surface>';

var array = html.split('>');
for (let index = 0; index < array.length; index++) {
  while (array[index].indexOf('<') > 0) {
    var text = array[index].substring(0, array[index].indexOf('<')).trim();
    var newTag = array[index].substring(array[index].indexOf('<')).trim();
    array[index] = newTag;
    if (text) { array.splice(index, 0, text); }
  }

  array[index] = array[index].trim();
}

console.dir(array);

