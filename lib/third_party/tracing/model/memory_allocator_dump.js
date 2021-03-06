/**
Copyright (c) 2015 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("./attribute.js");

'use strict';

/**
 * @fileoverview Provides the MemoryAllocatorDump class.
 */
global.tr.exportTo('tr.model', function() {
  /**
   * @constructor
   */
  function MemoryAllocatorDump(containerMemoryDump, fullName, opt_guid) {
    this.fullName = fullName;
    this.parent = undefined;
    this.children = [];
    this.attributes = {};

    // The associated container memory dump.
    this.containerMemoryDump = containerMemoryDump;

    // Ownership relationship between memory allocator dumps.
    this.owns = undefined;
    this.ownedBy = [];

    // Retention relationship between memory allocator dumps.
    this.retains = [];
    this.retainedBy = [];

    // For debugging purposes.
    this.guid = opt_guid;
  };

  /**
   * Size attribute names. Please refer to the Memory Dump Graph Metric
   * Calculation design document for more details (https://goo.gl/fKg0dt).
   */
  MemoryAllocatorDump.SIZE_ATTRIBUTE_NAME = 'size';
  MemoryAllocatorDump.EFFECTIVE_SIZE_ATTRIBUTE_NAME = 'effective_size';
  MemoryAllocatorDump.RESIDENT_SIZE_ATTRIBUTE_NAME = 'resident_size';
  MemoryAllocatorDump.DISPLAYED_SIZE_ATTRIBUTE_NAME =
      MemoryAllocatorDump.EFFECTIVE_SIZE_ATTRIBUTE_NAME;

  MemoryAllocatorDump.prototype = {
    get name() {
      return this.fullName.substring(this.fullName.lastIndexOf('/') + 1);
    },

    get quantifiedName() {
      return '\'' + this.fullName + '\' in ' +
          this.containerMemoryDump.containerName;
    },

    isDescendantOf: function(otherDump) {
      var dump = this;
      while (dump !== undefined) {
        if (dump === otherDump)
          return true;
        dump = dump.parent;
      }
      return false;
    },

    addAttribute: function(name, value) {
      if (name in this.attributes)
        throw new Error('Duplicate attribute name: ' + name + '.');
      this.attributes[name] = value;
    },

    aggregateAttributes: function(opt_model) {
      var attributes = {};

      this.children.forEach(function(child) {
        child.aggregateAttributes(opt_model);
        tr.b.iterItems(child.attributes, function(name) {
          attributes[name] = true;
        }, this);
      }, this);

      tr.b.iterItems(attributes, function(name) {
        var childAttributes = this.children.map(function(child) {
          return child.attributes[name];
        }, this);
        var currentAttribute = this.attributes[name];
        this.attributes[name] = tr.model.Attribute.aggregate(
            childAttributes, currentAttribute, opt_model);
      }, this);
    },

    getValidSizeAttributeOrUndefined: function(sizeAttrName, opt_model) {
      var sizeAttr = this.attributes[sizeAttrName];
      if (sizeAttr === undefined)
        return undefined;

      if (!(sizeAttr instanceof tr.model.ScalarAttribute)) {
        if (opt_model !== undefined) {
          opt_model.importWarning({
            type: 'memory_dump_parse_error',
            message: '\'' + sizeAttrName + '\' attribute of memory allocator ' +
                'dump \'' + memoryAllocatorDump.fullName + '\' is not a scalar.'
          });
        }
        return undefined;
      }

      return sizeAttr;
    }
  };

  /**
   * @constructor
   */
  function MemoryAllocatorDumpLink(source, target, opt_importance) {
    this.source = source;
    this.target = target;
    this.importance = opt_importance;
  }

  return {
    MemoryAllocatorDump: MemoryAllocatorDump,
    MemoryAllocatorDumpLink: MemoryAllocatorDumpLink
  };
});
