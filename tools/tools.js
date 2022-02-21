export function urlDetector(text) {
  const urlR =
    /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
  const url = text.match(urlR);
  return url != null;
}
export async function editMessageText(bot, msg, text, extras) {
  try {
    if (msg.inline_message_id)
      await bot.telegram.editMessageText(
        undefined,
        undefined,
        msg.inline_message_id,
        text,
        extras
      );
    else
      await bot.telegram.editMessageText(
        msg.chat.id,
        msg.message_id,
        undefined,
        text,
        extras
      );
  } catch (e) {
    console.log("editMessageText failed");
  }
}
export function json2query(params) {
  const query = Object.keys(params)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");
  return query;
}

export function isSupportedExt(filename) {
  if (!filename) return false;
  const ext = filename.substr(filename.lastIndexOf(".") + 1).toLowerCase();
  if (
    ext == "jpg" ||
    ext == "jpeg" ||
    ext == "gif" ||
    ext == "png" ||
    ext == "webp" ||
    ext == "bmp"
  )
    return true;
  return false;
}
export function getOtherSearches(text, url) {
  if (url) {
    text = text.replace(
      "{google}",
      '</i><a href="https://www.google.com/searchbyimage?image_url=' +
      url +
      '">Google Reverse Search</a><i>'
    );
    text = text.replace(
      "{saucenao}",
      '</i><a href="https://saucenao.com/search.php?url=' +
      url +
      '">SauceNAO</a><i>'
    );
    text = text.replace(
      "{tineye}",
      '</i><a href="https://tineye.com/search?url=' +
      url +
      '&sort=size&order=des">TinEye</a><i>'
    );
    text = text.replace(
      "{ascii2d}",
      '</i><a href="https://ascii2d.net/search/url/' +
      encodeURIComponent(url) +
      '">Ascii2d</a><i>'
    );
    return text;
  } else {
    text = text.substring(0, text.indexOf("."));
    return text;
  }
}