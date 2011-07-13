/*jslint strict: false, plusplus: false */
/*global $: false, document: false, window: false,
  Hyphenator: false, alert: false, jQuery: false */

(function () {

    var template,
        hasInfo = false,
        fullText = '',
        hasWindow = false,
        data = {},
        templateRegExp = /\{(\w+)\}/g;

    // preloader
    $(window).bind("load", function () {
        $("#preloader").fadeOut(1000, function () {
            $(this).remove();
        });
    });

    // nice easing
    $.extend($.easing, {
        easeOutExpo: function (x, t, b, c, d) {
            return (t === d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
        }
    });

    // helper function to reverse order of elements.
    $.fn.reverse = function () {
        return this.pushStack(this.get().reverse(), arguments);
    };

    function prepTemplate() {
        // parse out the template
        var templateNode = document.getElementById('template');

        template = templateNode.text.trim();

        // remove the template node from the DOM, since no longer needed.
        templateNode.parentNode.removeChild(templateNode);
    }

    function applyTemplate(pageData) {
        // add page data to main data. A bit hazardous since properties
        // are changed, but OK since it is the same fields each time.
        // revisit longer term.
        $.extend(data, pageData);

        return template.replace(templateRegExp, function (match, prop) {
            return data[prop] || '';
        });
    }

    function sizeContent() {
        var h = $(window).height(),
            lh = Math.floor($(window).height() / 24) * 24; // we use this to fix the baseline grid in webkit
        $("section, .wrapper, .titleInfo").css({ "height" : h });
        $("section.footer, section.footer > .wrapper, .footerInfo").css({ "height" : (h / 2) });
        $("article, .articleFlow").css({ "height" : (lh - 144) });
    }


    function onResize() {
        sizeContent();
    }

    // inject the HTML for the book content. Call this
    // after the page has loaded.
    function injectContent() {
        var footerDom = $('.footer'),
            tempNode = document.createElement('div'),
            tempFrag = document.createDocumentFragment(),
            childNode, text, totalPages, totalWidth, visibleWidth,
            targetNode, textNode, textValue, segments, length, range,
            textSnippet, size, rect, i, articleFlowNode, liveFrag,
            nodeRect, childRect, childIndex, frag, containerFrag, pageNode,
            pageWidth, pageNumber = 0;

        // create the document fragment that has all the text.
        tempNode.innerHTML = fullText;
        while ((childNode = tempNode.firstChild)) {
            tempFrag.appendChild(childNode);
        }

        while (tempFrag && tempFrag.childNodes && tempFrag.childNodes.length) {
            pageNumber += 1;

            // create a template section
            text = applyTemplate({
                pageNumber: pageNumber,
                pageClasses: pageNumber === 1 ? 'newChapter' : ''
            });

            // insert the text into a div, and then insert the book text.
            tempNode.innerHTML = text;
            articleFlowNode = $(tempNode).find('.articleFlow')[0];
            articleFlowNode.appendChild(tempFrag);

            // transfer the nodes created from the template to a fragment that
            // will go in the live DOM.
            liveFrag = document.createDocumentFragment();
            while ((childNode = tempNode.firstChild)) {
                liveFrag.appendChild(childNode);
            }

            // insert the fragment into the live DOM
            footerDom.before(liveFrag);
            sizeContent();

            // find the child node that is not completely visible within
            // the articleFlow.
            nodeRect = articleFlowNode.getBoundingClientRect();
            console.log('nodeRect ', nodeRect);

            for (i = 0; (childNode = articleFlowNode.childNodes[i]); i++) {
                if (childNode.getBoundingClientRect) {
                    childRect = childNode.getBoundingClientRect();
                    if (childRect.left > nodeRect.right) {
                        childIndex = i - 1;
                        break;
                    }
                }
            }

            if (childIndex < articleFlowNode.childNodes.length) {
                targetNode = articleFlowNode.childNodes[childIndex];
                textNode = targetNode.firstChild;
                textValue = textNode.nodeValue;
                segments = textValue.split(' ');
                length = segments.length;

                console.log('index is: ' + childIndex + ': ', targetNode);

                range = document.createRange();
                range.setStart(textNode, 0);

                // Cycle through different text lengths to see where the cutoff should be.
                for (i = segments.length; i > 0; i--) {
                    textSnippet = segments.slice(0, i).join(' ');
                    size = textSnippet.length - 1;

                    range.setEnd(textNode, size);
                    rect = range.getBoundingClientRect();

                    if (rect.top >= nodeRect.top && rect.bottom <= nodeRect.bottom && rect.left >= nodeRect.left && rect.right <= nodeRect.right) {
                        break;
                    }
                }

                if (i > 0) {
                    console.log('Found ENDPOINT: ' + textSnippet.substring(textSnippet.length - 20));

                    //Set the range now to be the text part that is *not* visible
                    range.setStart(textNode, textSnippet.length);
                    range.setEnd(textNode, textValue.length);

                    //Extract the range as a new node
                    frag = range.extractContents();

                    //Extract the rest of the childNodes and place them in a new container.
                    tempFrag = document.createDocumentFragment();
                    tempFrag.appendChild(frag);

                    while ((childNode = articleFlowNode.childNodes[childIndex + 1])) {
                        tempFrag.appendChild(childNode);
                    }
                } else {
                    tempFrag = null;
                }
            } else {
                tempFrag = null;
            }
        }

        // hmm where does the 10 come from?
        pageWidth = $(".scrollWidth").outerWidth() + 20;

        if (jQuery.browser.webkit) {
            $(".articleFlow").css({ "width" : totalWidth });
        }

        // update total pages
        $(".totalPages").text(pageNumber);

        // hyphenate
        Hyphenator.config({
            displaytogglebox : true,
            classname: 'articleFlow',
            orphancontrol: 2,
            minwordlength : 4
        });
        Hyphenator.run();
    }

    function init() {
        prepTemplate();
        injectContent();

        $(window)
            // size the pages
            .bind(/* "resize", */ sizeContent); // disable resize for now since it does not work

        // find all sections and scroll to them
        $("nav a.next").click(function () {
            var scrollTop = $(window).scrollTop();
            $('section').each(function (i, section) {
                var sectiontop = $(section).offset().top;
                if (scrollTop < sectiontop) {
                    $.scrollTo(section, 400, {easing: 'easeOutExpo'});
                    return false;
                }
            });
        });

        $("nav a.prev").click(function () {
            var scrollTop = $(window).scrollTop();
            $('section').reverse().each(function (i, section) {
                var sectiontop = $(section).offset().top;
                if (scrollTop > sectiontop) {
                    $.scrollTo(section, 400, {easing: 'easeOutExpo'});
                    return false;
                }
            });
        });

        // keyboard navigation between sections
        $(document.documentElement).keyup(function (event) {
            if (event.keyCode === 74) {
                $("nav a.next").click();
            } else if (event.keyCode === 75) {
                $("nav a.prev").click();
            }
        });
    }

    function checkComplete() {
        if (hasInfo && fullText && hasWindow) {
            init();
        }
    }

    $(window).bind('load', function () {
        hasWindow = true;
        checkComplete();
    });

    //Load the book info.
    $.ajax('info.json', {
        dataType: 'json',
        success: function (info, textStatus, jqXhr) {
            $.extend(data, info);
            hasInfo = true;
            checkComplete();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert('on noes. an error getting info! ' + errorThrown);
        }
    });

    //Load the book content.
    $.ajax('content.html', {
        dataType: 'text',
        success: function (text, textStatus, jqXhr) {
            fullText = text;
            checkComplete();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert('on noes. an error getting content! ' + errorThrown);
        }
    });
}());