/*
 * libcss-handler.c
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Handler functions for libcss.
 * Based on the source code of netsurf and libcss.
 * Base files available at http://source.netsurf-browser.org
 *
 * Part of the w3d project.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <libcss/libcss.h>

static css_error node_name(void *pw, void *node, css_qname *qname);
static css_error node_classes(void *pw, void *node,
		lwc_string ***classes, uint32_t *n_classes);
static css_error node_id(void *pw, void *node, lwc_string **id);
static css_error named_parent_node(void *pw, void *node,
		const css_qname *qname, void **parent);
static css_error named_sibling_node(void *pw, void *node,
		const css_qname *qname, void **sibling);
static css_error named_generic_sibling_node(void *pw, void *node,
		const css_qname *qname, void **sibling);
static css_error parent_node(void *pw, void *node, void **parent);
static css_error sibling_node(void *pw, void *node, void **sibling);
static css_error node_has_name(void *pw, void *node,
		const css_qname *qname, bool *match);
static css_error node_has_class(void *pw, void *node,
		lwc_string *name, bool *match);
static css_error node_has_id(void *pw, void *node,
		lwc_string *name, bool *match);
static css_error node_has_attribute(void *pw, void *node,
		const css_qname *qname, bool *match);
static css_error node_has_attribute_equal(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match);
static css_error node_has_attribute_dashmatch(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match);
static css_error node_has_attribute_includes(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match);
static css_error node_has_attribute_prefix(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match);
static css_error node_has_attribute_suffix(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match);
static css_error node_has_attribute_substring(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match);
static css_error node_is_root(void *pw, void *node, bool *match);
static css_error node_count_siblings(void *pw, void *node,
		bool same_name, bool after, int32_t *count);
static css_error node_is_empty(void *pw, void *node, bool *match);
static css_error node_is_link(void *pw, void *node, bool *match);
static css_error node_is_hover(void *pw, void *node, bool *match);
static css_error node_is_active(void *pw, void *node, bool *match);
static css_error node_is_focus(void *pw, void *node, bool *match);
static css_error node_is_enabled(void *pw, void *node, bool *match);
static css_error node_is_disabled(void *pw, void *node, bool *match);
static css_error node_is_checked(void *pw, void *node, bool *match);
static css_error node_is_target(void *pw, void *node, bool *match);
static css_error node_is_lang(void *pw, void *node,
		lwc_string *lang, bool *match);
static css_error ua_default_for_property(void *pw, uint32_t property,
		css_hint *hint);
static css_error set_libcss_node_data(void *pw, void *node,
		void *libcss_node_data);
static css_error get_libcss_node_data(void *pw, void *node,
		void **libcss_node_data);

/**
 * Selection callback table for libcss
 */
static css_select_handler selection_handler = {
	CSS_SELECT_HANDLER_VERSION_1,

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
};

/**
 * Font size computation callback for libcss
 *
 * \param pw      Computation context
 * \param parent  Parent font size (absolute)
 * \param size    Font size to compute
 * \return CSS_OK on success
 *
 * \post \a size will be an absolute font size
 */
css_error compute_font_size(void *pw, const css_hint *parent,
		css_hint *size)
{
	/**
	 * Table of font-size keyword scale factors
	 *
	 * These are multiplied by the configured default font size
	 * to produce an absolute size for the relevant keyword
	 */
	static const css_fixed factors[] = {
		FLTTOFIX(0.5625), /* xx-small */
		FLTTOFIX(0.6250), /* x-small */
		FLTTOFIX(0.8125), /* small */
		FLTTOFIX(1.0000), /* medium */
		FLTTOFIX(1.1250), /* large */
		FLTTOFIX(1.5000), /* x-large */
		FLTTOFIX(2.0000)  /* xx-large */
	};
	css_hint_length parent_size;

	/* Grab parent size, defaulting to medium if none */
	if (parent == NULL) {
		parent_size.value = FDIV(FMUL(factors[CSS_FONT_SIZE_MEDIUM - 1],
				INTTOFIX(nsoption_int(font_size))),
				INTTOFIX(10));
		parent_size.unit = CSS_UNIT_PT;
	} else {
		assert(parent->status == CSS_FONT_SIZE_DIMENSION);
		assert(parent->data.length.unit != CSS_UNIT_EM);
		assert(parent->data.length.unit != CSS_UNIT_EX);
		assert(parent->data.length.unit != CSS_UNIT_PCT);

		parent_size = parent->data.length;
	}

	assert(size->status != CSS_FONT_SIZE_INHERIT);

	if (size->status < CSS_FONT_SIZE_LARGER) {
		/* Keyword -- simple */
		size->data.length.value = FDIV(FMUL(factors[size->status - 1],
				INTTOFIX(nsoption_int(font_size))), F_10);
		size->data.length.unit = CSS_UNIT_PT;
	} else if (size->status == CSS_FONT_SIZE_LARGER) {
		/** \todo Step within table, if appropriate */
		size->data.length.value =
				FMUL(parent_size.value, FLTTOFIX(1.2));
		size->data.length.unit = parent_size.unit;
	} else if (size->status == CSS_FONT_SIZE_SMALLER) {
		/** \todo Step within table, if appropriate */
		size->data.length.value =
				FDIV(parent_size.value, FLTTOFIX(1.2));
		size->data.length.unit = parent_size.unit;
	} else if (size->data.length.unit == CSS_UNIT_EM ||
			size->data.length.unit == CSS_UNIT_EX) {
		size->data.length.value =
			FMUL(size->data.length.value, parent_size.value);

		if (size->data.length.unit == CSS_UNIT_EX) {
			/* 1ex = 0.6em in NetSurf */
			size->data.length.value = FMUL(size->data.length.value,
					FLTTOFIX(0.6));
		}

		size->data.length.unit = parent_size.unit;
	} else if (size->data.length.unit == CSS_UNIT_PCT) {
		size->data.length.value = FDIV(FMUL(size->data.length.value,
				parent_size.value), INTTOFIX(100));
		size->data.length.unit = parent_size.unit;
	}

	size->status = CSS_FONT_SIZE_DIMENSION;
	return CSS_OK;
}

lwc_string* NULL_STR;
lwc_intern_string("", 0, &NULL_STR);

/*
 * Generic get function to be used by callbacks. Must return string.
 */
lwc_string* get_string (
    void *node,
    const char* (*js_fun)(const char*)
)
{
  lwc_string* n = node;
  const char* node_string = lwc_string_data(n);

  const char* js_results =
    (*js_fun)(node_string);

  if (*js_results == "\0")
  {
    return NULL;
  }

  lwc_string *results;
  lwc_intern_string(js_results, strlen(js_results), &results);

  return results;
}

/*
 * Generic search function to be used by callbacks. Must return boolean.
 */
bool match_bool (
    void *node,
    void *search_parameter,
    void *match_parameter,
    const char* (*js_fun)(const char*, const char*, const char*)
)
{
  lwc_string* n = node;
  const char* node_string = lwc_string_data(n);

  lwc_string* s = search_parameter;
  const char* search_string = s == NULL
    ? lwc_string_data(NULL_STR)
    : lwc_string_data(s);

  lwc_string* m = match_parameter;
  const char* match_string = m == NULL
    ? lwc_string_data(NULL_STR)
    : lwc_string_data(m);

  return (*js_fun)(node_string, search_string,  match_string);
}

/*
 * Generic search function to be used by callbacks. Must return string.
 */
lwc_string* match_string (
    void *node,
    void *search_parameter,
    const char* (*js_fun)(const char*, const char*)
)
{
  lwc_string* n = node;
  const char* node_string = lwc_string_data(n);
  lwc_string* s = search_parameter;
  const char* match_string = lwc_string_data(s);

  const char* js_results =
    (*js_fun)(node_string, match_string);

  if (*js_results == "\0")
  {
    return NULL;
  }

  lwc_string *results;
  lwc_intern_string(js_results, strlen(js_results), &results);

  return results;
}

/******************************************************************************
 * Style selection callbacks                                                  *
 ******************************************************************************/

/**
 * Callback to retrieve a node's name.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param qname  Pointer to location to receive node name
 * \return CSS_OK on success,
 *         CSS_NOMEM on memory exhaustion.
 */
css_error node_name(void *pw, void *node, css_qname *qname)
{
  const char* namespace = "nodes";
  lwc_string *namespace_ptr;
  lwc_intern_string(namespace, strlen(namespace), &namespace_ptr);
  qname->ns = namespace_ptr;

  qname->name = get_string(node, js_node_name);
  return CSS_OK;
}

/**
 * Callback to retrieve a node's classes.
 *
 * \param pw         HTML document
 * \param node       DOM node
 * \param classes    Pointer to location to receive class name array
 * \param n_classes  Pointer to location to receive length of class name array
 * \return CSS_OK on success,
 *         CSS_NOMEM on memory exhaustion.
 *
 * \note The returned array will be destroyed by libcss. Therefore, it must
 *       be allocated using the same allocator as used by libcss during style
 *       selection.
 */
css_error node_classes(void *pw, void *node,
		lwc_string ***classes, uint32_t *n_classes)
{
  lwc_string* n = node;
  const char* node_string = lwc_string_data(n);

  /* This js function returns a stringified array of class strings */
  const char* js_results = js_node_classes(node_string);
  size_t js_results_s = strlen(js_results);

  /* Bail out */
  if (*js_results == NULL)
  {
    *classes = NULL;
    *n_classes = 0;
    return CSS_OK;
  }

  char* current_c = js_results;
  uint32_t n = 1;
  while(*current_c != NULL)
  {
    if (*(++current_c) == "&")
    {
      ++n;
    }
  }

  lwc_string** ptr_array = malloc(sizeof(lwc_string*));

  const char current_class[js_results_s + 1];
  int offset = 0;
  current_c = js_results;
  while (*current_c != NULL)
  {
    switch (*current_c)
    {
      case "\"":
      case "[":
      case "]":
        ++current_c;
        break;

      case ",":
        current_class[++current_c] = "\0";
        lwc_string* class_name;
        lwc_intern_string(current_class, strlen(current_class), &class_name);
        ptr_array[offset++] = class_name;
        break;

      default:
        current_class[current_c] = *(current_c++);
    }
  }

	*classes = ptr_array;
	*n_classes = n;
	return CSS_OK;
}

/**
 * Callback to retrieve a node's ID.
 *
 * \param pw    HTML document
 * \param node  DOM node
 * \param id    Pointer to location to receive id value
 * \return CSS_OK on success,
 *         CSS_NOMEM on memory exhaustion.
 */
css_error node_id(void *pw, void *node, lwc_string **id)
{
  *id = get_string(node, js_node_id);
  return CSS_OK;
}

/**
 * Callback to find a named ancestor node.
 *
 * \param pw        HTML document
 * \param node      DOM node
 * \param qname     Node name to search for
 * \param ancestor  Pointer to location to receive ancestor
 * \return CSS_OK.
 *
 * \post \a ancestor will contain the result, or NULL if there is no match
 */
css_error named_ancestor_node(void *pw, void *node,
		const css_qname *qname, void **ancestor)
{
  *ancestor = match_string(node, qname->name, js_named_ancestor_node);
  return CSS_OK;
}

/**
 * Callback to find a named parent node
 *
 * \param pw      HTML document
 * \param node    DOM node
 * \param qname   Node name to search for
 * \param parent  Pointer to location to receive parent
 * \return CSS_OK.
 *
 * \post \a parent will contain the result, or NULL if there is no match
 */
css_error named_parent_node(void *pw, void *node,
		const css_qname *qname, void **parent)
{
  *parent = match_string(node, qname->name, js_named_parent_node);
  return CSS_OK;
}

/**
 * Callback to find a named sibling node.
 *
 * NOTE: According to the NetSurf source code, this function returns a node
 * only if the Node.previousSibling is the searched node!
 *
 * \param pw       HTML document
 * \param node     DOM node
 * \param qname    Node name to search for
 * \param sibling  Pointer to location to receive sibling
 * \return CSS_OK.
 *
 * \post \a sibling will contain the result, or NULL if there is no match
 */
css_error named_sibling_node(void *pw, void *node,
		const css_qname *qname, void **sibling)
{
  *sibling = match_string(node, qname->name, js_named_sibling_node);
  return CSS_OK;
}

/**
 * Callback to find a named generic sibling node.
 *
 * NOTE: According to the NetSurf source code, this function returns any
 * sibling node that matches the search!
 *
 * \param pw       HTML document
 * \param node     DOM node
 * \param qname    Node name to search for
 * \param sibling  Pointer to location to receive ancestor
 * \return CSS_OK.
 *
 * \post \a sibling will contain the result, or NULL if there is no match
 */
css_error named_generic_sibling_node(void *pw, void *node,
		const css_qname *qname, void **sibling)
{
  *sibling = match_string(node, qname->name, js_named_generic_sibling_node);
  return CSS_OK;
}

/**
 * Callback to retrieve the parent of a node.
 *
 * \param pw      HTML document
 * \param node    DOM node
 * \param parent  Pointer to location to receive parent
 * \return CSS_OK.
 *
 * \post \a parent will contain the result, or NULL if there is no match
 */
css_error parent_node(void *pw, void *node, void **parent)
{
  *parent = get_string(node, js_parent_node);
  return CSS_OK;
}

/**
 * Callback to retrieve the preceding sibling of a node.
 *
 * \param pw       HTML document
 * \param node     DOM node
 * \param sibling  Pointer to location to receive sibling
 * \return CSS_OK.
 *
 * \post \a sibling will contain the result, or NULL if there is no match
 */
css_error sibling_node(void *pw, void *node, void **sibling)
{
  *sibling = get_string(node, js_sibling_node);
  return CSS_OK;
}

/**
 * Callback to determine if a node has the given name.
 *
 * NOTE: Element names are case insensitive in HTML
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param qname  Name to match
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_has_name(void *pw, void *node,
		const css_qname *qname, bool *match)
{
  *match = match_bool(node, qname->name, NULL, js_node_has_name);
  return CSS_OK;
}

/**
 * Callback to determine if a node has the given class.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param name   Name to match
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_has_class(void *pw, void *node,
		lwc_string *name, bool *match)
{
  *match = match_bool(node, name, NULL, js_node_has_class);
  return CSS_OK;
}

/**
 * Callback to determine if a node has the given id.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param name   Name to match
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_has_id(void *pw, void *node,
		lwc_string *name, bool *match)
{
  *match = match_bool(node, name, NULL, js_node_has_id);
  return CSS_OK;
}

/**
 * Callback to determine if a node has an attribute with the given name.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param qname  Name to match
 * \param match  Pointer to location to receive result
 * \return CSS_OK on success,
 *         CSS_NOMEM on memory exhaustion.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_has_attribute(void *pw, void *node,
		const css_qname *qname, bool *match)
{
  *match = match_bool(node, qname->name, NULL, js_node_has_attribute);
  return CSS_OK;
}

/**
 * Callback to determine if a node has an attribute with given name and value.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param qname  Name to match
 * \param value  Value to match
 * \param match  Pointer to location to receive result
 * \return CSS_OK on success,
 *         CSS_NOMEM on memory exhaustion.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_has_attribute_equal(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match)
{
  *match = match_bool(node, qname->name, value, js_node_has_attribute_equal);
  return CSS_OK;
}

/**
 * Callback to determine if a node has an attribute with the given name whose
 * value dashmatches that given.
 *
 * NOTE: Matches exact matches (case-insensitive) and matches that the observed
 * value equals the expected value plus a dash ("-").
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param qname  Name to match
 * \param value  Value to match
 * \param match  Pointer to location to receive result
 * \return CSS_OK on success,
 *         CSS_NOMEM on memory exhaustion.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_has_attribute_dashmatch(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match)
{
  *match =
    match_bool(node, qname->name, value, js_node_has_attribute_dashmatch);
  return CSS_OK;
}

/**
 * Callback to determine if a node has an attribute with the given name whose
 * value includes that given.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param qname  Name to match
 * \param value  Value to match
 * \param match  Pointer to location to receive result
 * \return CSS_OK on success,
 *         CSS_NOMEM on memory exhaustion.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_has_attribute_includes(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match)
{
  *match =
    match_bool(node, qname->name, value, js_node_has_attribute_includes);
  return CSS_OK;
}

/**
 * Callback to determine if a node has an attribute with the given name whose
 * value has the prefix given.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param qname  Name to match
 * \param value  Value to match
 * \param match  Pointer to location to receive result
 * \return CSS_OK on success,
 *         CSS_NOMEM on memory exhaustion.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_has_attribute_prefix(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match)
{
  *match =
    match_bool(node, qname->name, value, js_node_has_attribute_prefix);
  return CSS_OK;
}

/**
 * Callback to determine if a node has an attribute with the given name whose
 * value has the suffix given.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param qname  Name to match
 * \param value  Value to match
 * \param match  Pointer to location to receive result
 * \return CSS_OK on success,
 *         CSS_NOMEM on memory exhaustion.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_has_attribute_suffix(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match)
{
  *match =
    match_bool(node, qname->name, value, js_node_has_attribute_suffix);
  return CSS_OK;
}

/**
 * Callback to determine if a node has an attribute with the given name whose
 * value contains the substring given.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param qname  Name to match
 * \param value  Value to match
 * \param match  Pointer to location to receive result
 * \return CSS_OK on success,
 *         CSS_NOMEM on memory exhaustion.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_has_attribute_substring(void *pw, void *node,
		const css_qname *qname, lwc_string *value,
		bool *match)
{
  *match =
    match_bool(node, qname->name, value, js_node_has_attribute_substring);
  return CSS_OK;
}

/**
 * Callback to determine if a node is the root node of the document.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_is_root(void *pw, void *node, bool *match)
{
  *match = match_bool(node, NULL, NULL, js_node_is_root);
  return CSS_OK;
}

/**
 * Callback to count a node's siblings.
 *
 * \param pw         HTML document
 * \param n          DOM node
 * \param same_name  Only count siblings with the same name, or all
 * \param after      Count anteceding instead of preceding siblings
 * \param count      Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a count will contain the number of siblings
 */
css_error node_count_siblings(void *pw, void *n, bool same_name,
		bool after, int32_t *count)
{
  lcw_string* node = n;
  const char* node_string = lwc_string_data(n);

	*count = js_node_count_siblings(node_string, same_name, after);
	return CSS_OK;
}

/**
 * Callback to determine if a node is empty.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match will contain true if the node is empty and false otherwise.
 */
css_error node_is_empty(void *pw, void *node, bool *match)
{
  *match = match_bool(node, NULL, NULL, js_node_is_empty);
  return CSS_OK;
}

/**
 * Callback to determine if a node is a linking element.
 *
 * NOTE: In NetSurf, element must be <a> and have a href property.
 *
 * \param pw     HTML document
 * \param n      DOM node
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_is_link(void *pw, void *n, bool *match)
{
  *match = match_bool(node, NULL, NULL, js_node_is_link);
	return CSS_OK;
}

/**
 * Callback to determine if a node is a linking element whose target has been
 * visited.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_is_visited(void *pw, void *node, bool *match)
{
  *match = match_bool(node, NULL, NULL, js_node_is_visited);
	return CSS_OK;
}

/**
 * Callback to determine if a node is currently being hovered over.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_is_hover(void *pw, void *node, bool *match)
{
  *match = match_bool(node, NULL, NULL, js_node_is_hover);
	return CSS_OK;
}

/**
 * Callback to determine if a node is currently activated.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_is_active(void *pw, void *node, bool *match)
{
  *match = match_bool(node, NULL, NULL, js_node_is_active);
	return CSS_OK;
}

/**
 * Callback to determine if a node has the input focus.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_is_focus(void *pw, void *node, bool *match)
{
  *match = match_bool(node, NULL, NULL, js_node_is_focus);
	return CSS_OK;
}

/**
 * Callback to determine if a node is enabled.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match with contain true if the node is enabled and false otherwise.
 */
css_error node_is_enabled(void *pw, void *node, bool *match)
{
  *match = match_bool(node, NULL, NULL, js_node_is_enabled);
	return CSS_OK;
}

/**
 * Callback to determine if a node is disabled.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match with contain true if the node is disabled and false otherwise.
 */
css_error node_is_disabled(void *pw, void *node, bool *match)
{
  *match = match_bool(node, NULL, NULL, js_node_is_disabled);
	return CSS_OK;
}

/**
 * Callback to determine if a node is checked.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match with contain true if the node is checked and false otherwise.
 */
css_error node_is_checked(void *pw, void *node, bool *match)
{
  *match = match_bool(node, NULL, NULL, js_node_is_checked);
	return CSS_OK;
}

/**
 * Callback to determine if a node is the target of the document URL.
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match with contain true if the node matches and false otherwise.
 */
css_error node_is_target(void *pw, void *node, bool *match)
{
  *match = match_bool(node, NULL, NULL, js_node_is_target);
	return CSS_OK;
}

/**
 * Callback to determine if a node has the given language
 *
 * \param pw     HTML document
 * \param node   DOM node
 * \param lang   Language specifier to match
 * \param match  Pointer to location to receive result
 * \return CSS_OK.
 *
 * \post \a match will contain true if the node matches and false otherwise.
 */
css_error node_is_lang(void *pw, void *node,
		lwc_string *lang, bool *match)
{
	*match = match_bool(node, lang, NULL, js_node_is_lang);
	return CSS_OK;
}

/*
 * NOTE: Somehow apparently NetSurf doesn't bother implementing this.
 */
css_error (*node_presentational_hint)(void *pw, void *node,
			uint32_t *nhints, css_hint **hints)
{
  /*
   * TODO: Maybe implement presentational hints,
   * when we find out what it means?
   * */
  *nhints = 0;
  *hints = NULL;
  return CSS_OK;
}

/**
 * Callback to retrieve the User-Agent defaults for a CSS property.
 *
 * \param pw        HTML document
 * \param property  Property to retrieve defaults for
 * \param hint      Pointer to hint object to populate
 * \return CSS_OK       on success,
 *         CSS_INVALID  if the property should not have a user-agent default.
 */
css_error ua_default_for_property(void *pw, uint32_t property, css_hint *hint)
{
	if (property == CSS_PROP_COLOR) {
		hint->data.color = 0xff000000;
		hint->status = CSS_COLOR_COLOR;

	} else if (property == CSS_PROP_FONT_FAMILY) {
                /* TODO: Implement default font option */
		hint->data.strings = NULL;
                hint->status = CSS_FONT_FAMILY_SANS_SERIF;
		
	} else if (property == CSS_PROP_QUOTES) {
		/** \todo Not exactly useful :) */
		hint->data.strings = NULL;
		hint->status = CSS_QUOTES_NONE;
	} else if (property == CSS_PROP_VOICE_FAMILY) {
		/** \todo Fix this when we have voice-family done */
		hint->data.strings = NULL;
		hint->status = 0;
	} else {
		return CSS_INVALID;
	}

	return CSS_OK;
}

css_error set_libcss_node_data(void *pw, void *node, void *libcss_node_data)
{
	dom_node *n = node;
	dom_exception err;
	void *old_node_data;

	/* Set this node's node data */
	err = dom_node_set_user_data(n,
			corestring_dom___ns_key_libcss_node_data,
			libcss_node_data, nscss_dom_user_data_handler,
			(void *) &old_node_data);
	if (err != DOM_NO_ERR) {
		return CSS_NOMEM;
	}

	assert(old_node_data == NULL);

	return CSS_OK;
}

css_error get_libcss_node_data(void *pw, void *node, void **libcss_node_data)
{
	dom_node *n = node;
	dom_exception err;

	/* Get this node's node data */
	err = dom_node_get_user_data(n,
			corestring_dom___ns_key_libcss_node_data,
			libcss_node_data);
	if (err != DOM_NO_ERR) {
		return CSS_NOMEM;
	}

	return CSS_OK;
}
