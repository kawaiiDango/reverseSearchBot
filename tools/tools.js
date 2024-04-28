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
