// Module Federation requires an async boundary before importing the app.
// This file is the true webpack entry point; it dynamically imports bootstrap
// so that shared modules (react, react-dom) can be negotiated at runtime.
import("./bootstrap");
