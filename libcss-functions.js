/*
 * libcss-functions.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Javascript functions to be provided to libcss.
 */

'use strict';

function resolve_url (pw, base, rel, abs) {}
function node_name (pw, node, qname) {}
function node_classes (pw, node, classes, n_classes) {}
function node_id (pw, node, id) {}
function named_ancestor_node (pw, node, qname, ancestor) {}
function named_parent_node (pw, node, qname, parent) {}
function named_sibling_node (pw, node, qname,	sibling) {}
function named_generic_sibling_node (pw, node, qname,	sibling) {}
function parent_node (pw, node, parent) {}
function sibling_node (pw, node, sibling) {}
function node_has_name (pw, node, qname, match) {}
function node_has_class (pw, node, name, match) {}
function node_has_id (pw, node, name, match) {}
function node_has_attribute (pw, node, qname,	match) {}
function node_has_attribute_equal (pw, node, qname,	value, match) {}
function node_has_attribute_dashmatch (pw, node, qname,	value, match) {}
function node_has_attribute_includes (pw, node, qname, value, match) {}
function node_has_attribute_prefix (pw, node, qname, value,	match) {}
function node_has_attribute_suffix (pw, node, qname, value,	match) {}
function node_has_attribute_substring (pw, node, qname,	value, match) {}
function node_is_root (pw, node, match) {}
function node_count_siblings (pw, node,	same_name, after, count) {}
function node_is_empty (pw, node, match) {}
function node_is_link (pw, node, match) {}
function node_is_visited (pw, node, match) {}
function node_is_hover (pw, node, match) {}
function node_is_active (pw, node, match) {}
function node_is_focus (pw, node, match) {}
function node_is_enabled (pw, node, match) {}
function node_is_disabled (pw, node, match) {}
function node_is_checked (pw, node, match) {}
function node_is_target (pw, node, match) {}
function node_is_lang (pw, node, lang, match) {}
function node_presentational_hint (pw, node, property, hints) {}
function ua_default_for_property (pw, property, hint) {}
function compute_font_size (pw, parent, size) {}
function set_libcss_node_data (pw, n,	libcss_node_data) {}
function get_libcss_node_data (pw, n,	libcss_node_data) {}

module.exports = [
  node_name,
  node_classes,
  node_id,
  named_ancestor_node,
  named_parent_node,
  named_sibling_node,
  named_generic_sibling_node,
  parent_node,
  sibling_node,
  node_has_name,
  node_has_class,
  node_has_id,
  node_has_attribute,
  node_has_attribute_equal,
  node_has_attribute_dashmatch,
  node_has_attribute_includes,
  node_has_attribute_prefix,
  node_has_attribute_suffix,
  node_has_attribute_substring,
  node_is_root,
  node_count_siblings,
  node_is_empty,
  node_is_link,
  node_is_visited,
  node_is_hover,
  node_is_active,
  node_is_focus,
  node_is_enabled,
  node_is_disabled,
  node_is_checked,
  node_is_target,
  node_is_lang,
  node_presentational_hint,
  ua_default_for_property,
  compute_font_size,
  set_libcss_node_data,
  get_libcss_node_data
];
