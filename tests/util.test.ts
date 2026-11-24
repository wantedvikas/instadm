import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { firstDm, matchesKeyword, summarize, readSigned, signValue, verifySignature } from "../lib/util.ts";

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

test("summarize", () => {
  const s = summarize([
    { at: 1, igsid: "a", username: "amy", text: "link pls", status: "button_sent" },
    { at: 2, igsid: "a", status: "follow_asked" },
    { at: 3, igsid: "a", status: "link_sent" },
    { at: 4, igsid: "b", username: "bob", text: "nice", status: "no_match" },
    { at: 5, igsid: "a", username: "amy", text: "thanks", status: "no_match" },
  ]);
  assert.equal(s.comments, 3);
  assert.equal(s.dmsSent, 3);
  assert.equal(s.linksDelivered, 1);
  assert.deepEqual(s.rows.map((r) => [r.username, r.status, r.text]), [["amy", "link_sent", "thanks"], ["bob", "no_match", "nice"]]);
});
