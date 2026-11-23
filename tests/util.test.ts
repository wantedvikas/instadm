import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { firstDm, matchesKeyword, readSigned, signValue, verifySignature } from "../lib/util.ts";

test("keywords", () => {
  assert.ok(matchesKeyword("anything", ""));
  assert.ok(matchesKeyword("Send me the LINK please", "link, repo"));
  assert.ok(matchesKeyword("repo!", "link, repo"));
  assert.ok(!matchesKeyword("linkedin", "link"));
  assert.ok(matchesKeyword("please send code now", "send code"));
  assert.ok(!matchesKeyword("nice video", "link"));
});

test("webhook signature", () => {
  const body = '{"object":"instagram"}';
  const sig = "sha256=" + createHmac("sha256", "s2").update(body).digest("hex");
  assert.ok(verifySignature(body, sig, [undefined, "s1", "s2"]));
  assert.ok(!verifySignature(body + " ", sig, ["s2"]));
  assert.ok(!verifySignature(body, null, ["s2"]));
  assert.ok(!verifySignature(body, sig, [undefined]));
});

test("signed session", () => {
  const v = signValue("12345", "secret");
  assert.equal(readSigned(v, "secret"), "12345");
  assert.equal(readSigned(v, "other"), null);
  assert.equal(readSigned("12345.deadbeef", "secret"), null);
  assert.equal(readSigned(undefined, "secret"), null);
});

test("first DM", () => {
  const rule = { replyText: "Hey {username}!", linkMessage: "https://x.dev", followGate: false };
  assert.deepEqual(firstDm(rule, "sam"), { text: "Hey sam!\n\nhttps://x.dev", withButton: false });
  assert.deepEqual(firstDm({ ...rule, followGate: true }, "sam"), { text: "Hey sam!", withButton: true });
  assert.equal(firstDm({ ...rule, replyText: "" }, "sam").text, "https://x.dev");
});
