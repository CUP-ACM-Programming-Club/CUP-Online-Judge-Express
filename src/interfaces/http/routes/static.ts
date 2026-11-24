import express from "express";
import path from "path";

const oneDay = 86400000;

export = ["/static", express.static(path.join(process.cwd(), "static"), {
	maxAge: oneDay * 30
})];
