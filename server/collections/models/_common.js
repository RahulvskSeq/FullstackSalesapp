// Shared schema options for the Collections module. Every collection is
// prefixed col_ so nothing here can collide with the rest of the application.
export const opts = (collection, extra = {}) => ({ timestamps: true, collection, minimize: false, ...extra });
export const YMD = /^\d{4}-\d{2}-\d{2}$/;   // calendar day, the app's convention
export const YM  = /^\d{4}-\d{2}$/;         // period
