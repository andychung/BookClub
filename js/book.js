/*jslint strict: false */
/*global $: false, document: false, window: false,
  Hyphenator: false, alert: false */

(function () {

    var template,
        hasInfo = false,
        hasText = false,
        hasWindow = false,
        data = {},
        templateRegExp = /\{(\w+)\}/g;

    // preloader
    $(window).bind("load", function() {
        $("#preloader").fadeOut(2000,function(){ 
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
        var h = $(window).height();
        $("section, .wrapper, .titleInfo").css({ "height" : h });
        $("section.footer, section.footer > .wrapper, .footerInfo").css({ "height" : (h / 2) });
        $("article, .articleFlow").css({ "height" : (h - 148) });
    }


    function onResize() {
        sizeContent();
    }

    // inject the HTML for the book content. Call this
    // after the page has loaded.
    function injectContent() {
        var footerDom = $('.footer'),
            text, totalPages, totalWidth, visibleWidth;

        // inject the first copy of the story to figure out sizes/page numbers.
        text = applyTemplate({
            offset: 0,
            pageNumber: 1,
            pageClasses: 'newChapter'
        });
        footerDom.before(text);
        sizeContent();

        // find width of the story
        totalWidth = $(".scrollWidth").attr("scrollWidth");
        // hmm where does the 10 come from?
        pageWidth = $(".scrollWidth").outerWidth() + 20;

        totalPages = Math.ceil(totalWidth / pageWidth);

        // generate the rest of the pages
        text = '';
        for (i = 1; i < totalPages; i++) {
            text += applyTemplate({
                offset: -(i * pageWidth),
                pageNumber: i + 1,
                pageClasses: ''
            });
        }

        footerDom.before(text);
        sizeContent();

        // update total pages
        $(".totalPages").text(totalPages);

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
        if (hasInfo && hasText && hasWindow) {
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
            data.content = text;
            hasText = true;
            checkComplete();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert('on noes. an error getting content! ' + errorThrown);
        }
    });
}());