// TODO: write function to determine number of # set based on number of frames in composition
defineJSON();
// GLOBAL VARIABLES 
var outputDir, templateDropdown;
var currentComp = app.project.activeItem;
var previousComp = null; 
var clickablesWidth = 150;
var clickablesHeight = 25; 

(function(thisObj) {
    var myScriptPal = buildUI(thisObj);
    if (myScriptPal instanceof Window) {
        myScriptPal.center();
        myScriptPal.show();
    } else {
        myScriptPal.layout.layout(true);
    }
})(this);

function buildUI(thisObj) {
    var scriptName = "QuickRender";
    var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", scriptName, undefined, {resizeable: true});

    // __________________UI Markdown__________________ //
    myPanel.orientation = 'column';
    myPanel.alignChildren = ['fill', 'top'];
    myPanel.spacing = 10;
    myPanel.margins = 16;

    // Render Button ▶️
    var renderBtn = myPanel.add("button", undefined, "▶️ Render");

    // Snap Button 📸
    var renderStill = myPanel.add("button", undefined, "📸 Render Still at Playhead")

    // OutPut Directory 📂
    outputDirBtn = myPanel.add("button", undefined, "📂 Select Render Path");
    outputDir = myPanel.add("edittext", undefined, "No Path Set");
    outputDir.size = [clickablesWidth, clickablesHeight];

    // Templates Dropdown 🔽
    var templateDropdownInstruction = myPanel.add("statictext", undefined, "Select a Template:");
    templateDropdownInstruction.alignment = ["left", "top"];

    templateDropdown = myPanel.add("dropdownlist", undefined, []);
    templateDropdown.alignment = ["left", "top"];
    templateDropdown.size = [clickablesWidth, clickablesHeight];

    // Save button 💾 
    var saveSettingsBtn = myPanel.add("button", undefined, "💾 Save Settings");

    var uiElements = [renderBtn, outputDirBtn, outputDir, templateDropdownInstruction, templateDropdown, saveSettingsBtn];

    // _______________⏯BUTTONS, CLICKS, DROPDOWNS⏯_____________//
    // Updates UI when panel clicked
    myPanel.addEventListener('mouseup', function() {
        isSameCompThenUpdate();
    });

    myPanel.onResize = function() {
        resizeUIElements(myPanel, uiElements);
    }

    renderBtn.onClick = function() {
        isSameCompThenUpdate();
        if (currentComp && currentComp instanceof CompItem) {
            if (!templateDropdown.selection || outputDir.text === "No path set") {
                alert("Please ensure both a template is selected and an output path is set.");
                return;
            }

            // Load settings
            var settings = loadRenderSettings(currentComp);
            if (!settings || settings.inPoint === undefined || settings.outPoint === undefined) {
                alert("InPoint and OutPoint not set in the settings.");
                return;
            }

            // Start an undo group to save the current state
            app.beginUndoGroup("Set Work Area for Rendering");

            // Change the work area start and end points based on saved settings
            currentComp.workAreaStart = settings.inPoint;
            currentComp.workAreaDuration = settings.outPoint - settings.inPoint;

            // End the undo group to save the state before rendering
            app.endUndoGroup();

            // Add the composition to the render queue and set the output module
            var renderQueueItem = app.project.renderQueue.items.add(currentComp);
            var outputModule = renderQueueItem.outputModules[1];
            outputModule.applyTemplate(templateDropdown.selection.text);
            outputModule.file = new File(outputDir.text + "/" + currentComp.name + "_[#####]");
            renderQueueItem.timeSpanStart = settings.inPoint;
            renderQueueItem.timeSpanDuration = settings.outPoint - settings.inPoint;

            // Start rendering separately
            app.project.renderQueue.render();
        }
    };

    renderStill.onClick = renderSnapShot;

    outputDirBtn.onClick = function() {
        isSameCompThenUpdate();
        var folder = Folder.selectDialog("Select the output folder");
        if (folder) {
            outputDir.text = folder.fsName;
        }
    };     

    // Ensures templates dropdown is always up to date
    templateDropdown.onActivate = function() {
        if (!templateDropdown.items.length || templateDropdown.items[0].text === "No templates found" || 
            templateDropdown.items[0].text === "No output modules found" || 
            templateDropdown.items[0].text === "No render queue items found") {
            loadTemplates();
        }
    };

    templateDropdown.onChange = function() {
        if (templateDropdown.selection) {
            templateDropdownInstruction.text = "Template selected:";
        } else {
            templateDropdownInstruction.text = "Select a template:";
        }
    };

    saveSettingsBtn.onClick = function() {
        if (currentComp && currentComp instanceof CompItem) {
            if (!templateDropdown.selection || outputDir.text === "No path set") {
                alert("Please ensure both a template is selected and an output path is set.");
                return;
            }
            saveRenderSettings(currentComp, templateDropdown.selection.text, outputDir.text);
            alert("QuickRender settings saved for " + currentComp.name);
        }
    };   

    updateUI();
    loadTemplates();
    resizeUIElements(myPanel, uiElements); 

    return myPanel;
}

// _______________🔄HELPER FUNCTIONS🔄_____________//
function isSameCompThenUpdate() {
    var sameComp = checkAndUpdateComp();
    if (!sameComp) {
        updateUI();
    }
}
// Function to resize UI elements based on panel size
function resizeUIElements(panel, uiElements) {
    var panelWidth = panel.size[0];
    var newClickablesWidth = panelWidth - (2 * panel.margins[0]); // Adjust width based on panel margins

    // Ensure the new width is not less than the minimum width
    if (newClickablesWidth < clickablesWidth) {
        newClickablesWidth = clickablesWidth;
    }

    // Set the new width for all UI elements
    for (var i = 0; i < uiElements.length; i++) {
        if (uiElements[i] !== templateDropdown) {
            uiElements[i].size = [newClickablesWidth, clickablesHeight];
        }
    }

    // Reposition elements to adjust to new size
    panel.layout.layout(true);
    panel.layout.resize();
}


function saveRenderSettings(comp, templateName, outputDirectory) {
    if (comp) {
        var inPoint = comp.workAreaStart;
        var outPoint = comp.workAreaStart + comp.workAreaDuration;
        var settings = loadRenderSettings(comp);
        if (!settings) {
            settings = {};
        }

        settings.templateName = templateName;
        settings.outputDirectory = outputDirectory;
        settings.inPoint = inPoint;
        settings.outPoint = outPoint; 

        var settingsString = JSON.stringify(settings);
        var currentComment = comp.comment;

        // Remove existing QuickRenderSettings if present
        var newComment = currentComment.replace(/QuickRenderSettings:\{.*?\}###/g, "");
        newComment += " QuickRenderSettings:" + settingsString + "###";
        comp.comment = newComment;
    }
}

function loadRenderSettings(comp) {
    var regex = /QuickRenderSettings:\{.*?\}###/g;
    var matches = comp.comment.match(regex);
    if (matches && matches.length > 0) {
        try {
            var settingsString = matches[matches.length - 1].replace("QuickRenderSettings:", "").replace("###", "");
            var settings = JSON.parse(settingsString);
            return settings;
        } catch (e) {
            alert("Error parsing settings: " + e.message);
            return null;
        }
    }
    return null;
}

function checkAndUpdateComp() {
    currentComp = app.project.activeItem;
    if (currentComp && currentComp instanceof CompItem) {
        if (previousComp === null) {
            previousComp = currentComp;
            return false; 
        } else {
            if (previousComp === currentComp) {
                return true; 
            } else {
                previousComp = currentComp;
                return false; 
            }
        }
    } else {
        previousComp = null; 
        alert("No active comp!");
        return false; 
    }
}

function updateUI() {
    if (currentComp && currentComp instanceof CompItem) {
        loadTemplates();
        var settings = loadRenderSettings(currentComp);
        if (settings) {
            var foundTemplate = templateDropdown.find(settings.templateName);
            if (foundTemplate) {
                templateDropdown.selection = foundTemplate;
            } else {
                templateDropdown.selection = null;
            }
            outputDir.text = settings.outputDirectory || "No path set";
        } else {
            templateDropdown.selection = null;
            outputDir.text = "No path set";
        }
        templateDropdown.enabled = true;
        outputDirBtn.enabled = true;
    } else {
        templateDropdown.selection = null;
        outputDir.text = "No path set";
        templateDropdown.enabled = false;
        outputDirBtn.enabled = false;
    }
}

function loadTemplates() {
    templateDropdown.removeAll();
    var originalComp = currentComp;

    if (app.project.renderQueue.numItems > 0) {
        // Accessing existing templates from the first item in the render queue
        var outputModule = app.project.renderQueue.item(1).outputModules[1];
        if (outputModule) {
            var templates = outputModule.templates;
            if (templates && templates.length > 0) {
                for (var i = 0; i < templates.length; i++) {
                    templateDropdown.add("item", templates[i]);
                }
            } else {
                templateDropdown.add("item", "No templates found");
            }
        } else {
            templateDropdown.add("item", "No output modules found");
        }
    } else {
        // Create a temporary composition to get templates
        var tempComp = app.project.items.addComp("TempComp", 100, 100, 1, 1, 25);
        var renderQueueItem = app.project.renderQueue.items.add(tempComp);
        var outputModule = renderQueueItem.outputModules[1];

        if (outputModule) {
            var templates = outputModule.templates;
            if (templates && templates.length > 0) {
                for (var i = 0; i < templates.length; i++) {
                    templateDropdown.add("item", templates[i]);
                }
            } else {
                templateDropdown.add("item", "No templates found");
            }
        }
        // Clean up by removing the temporary items
        renderQueueItem.remove();
        tempComp.remove();
    }

    // Restore the original composition to active if available
    if (originalComp) {
        originalComp.openInViewer();
    }
}

function renderSnapShot() {
    if (currentComp && currentComp instanceof CompItem) {
        if (outputDir.text === "No path set") {
            alert("Please ensure a render path is set.");
            return;
        }

        // Get the current playhead position
        var playheadPosition = currentComp.time;
        var frameNumber = Math.floor(playheadPosition / currentComp.frameDuration);

        // Add the composition to the render queue
        var renderQueueItem = app.project.renderQueue.items.add(currentComp);

        // Set the time span to render a single frame
        renderQueueItem.timeSpanStart = playheadPosition;
        renderQueueItem.timeSpanDuration = currentComp.frameDuration;

        // Configure the output module using the "TIFF Sequence with Alpha" template
        var outputModule = renderQueueItem.outputModules[1];
        var outputFilePath = outputDir.text + "/" + currentComp.name + "_QuickRenderStill_" + frameNumber + ".tif";
        outputModule.file = new File(outputFilePath);
        outputModule.applyTemplate("TIFF Sequence with Alpha");

        // Render the frame
        app.project.renderQueue.render();

        // Remove the render queue item after rendering
        renderQueueItem.remove();

        alert("Still rendered and saved to: " + outputFilePath);
    } else {
        alert("No active composition.");
    }
}

// Ensure JSON is defined
function defineJSON() {
    if (typeof JSON === 'undefined') {
        JSON = {
            parse: function (sJSON) { return eval('(' + sJSON + ')'); },
            stringify: function (vContent) {
                if (vContent instanceof Object) {
                    var sOutput = "";
                    if (vContent.constructor === Array) {
                        for (var nId = 0; nId < vContent.length; sOutput += this.stringify(vContent[nId]) + ",", nId++);
                        return "[" + sOutput.substr(0, sOutput.length - 1) + "]";
                    }
                    if (vContent.toString !== Object.prototype.toString) { return "\"" + vContent.toString().replace(/"/g, "\\$&") + "\""; }
                    for (var sProp in vContent) {
                        sOutput += "\"" + sProp.replace(/"/g, "\\$&") + "\":" + this.stringify(vContent[sProp]) + ",";
                    }
                    return "{" + sOutput.substr(0, sOutput.length - 1) + "}";
                }
                return typeof vContent === "string" ? "\"" + vContent.replace(/"/g, "\\$&") + "\"" : String(vContent);
            }
        };
    }
}