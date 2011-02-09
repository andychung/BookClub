$(document).ready(function () {

    // nice easing
    $.extend( $.easing, {
        easeOutExpo: function (x, t, b, c, d) {
            return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
        },
    });
    
    // size the pages
    $(window).bind("load resize", function() {
        var h = $(window).height();
        $("section, .wrapper, .titleInfo").css({ "height" : h });
        $("section.footer, section.footer > .wrapper, .footerInfo").css({ "height" : (h/2) });
        $("article, .articleFlow").css({ "height" : (h-148) }); //this must be a multiple of 24
    });
    
    // find width of the story
/*
    $(window).bind("load", function() {
        alert($("#scrollWidth").attr("scrollWidth"));
    });
*/
    
    // find all sections and scroll to them 
    $("nav a.next").click(function() {
        var scrollTop = $(window).scrollTop();
            $('section').each(function(i, section){ 
                sectiontop = $(section).offset().top;
                if (scrollTop < sectiontop) {
                    $.scrollTo(section, 400, {easing:'easeOutExpo'});
                return false;
            } 
        });
    });

    $.fn.reverse = function() {
    return this.pushStack(this.get().reverse(), arguments);
    };

    $("nav a.prev").click(function(){
        var scrollTop = $(window).scrollTop();
            $('section').reverse().each(function(i, section){
                sectiontop = $(section).offset().top;
                if (scrollTop > sectiontop) { 
                    $.scrollTo(section, 400, {easing:'easeOutExpo'});
                return false;
            }
        });
    });
    
    // calculate total pages
    var totalPages = $("section.page").size();
    $(".totalPages").text(totalPages);
    
    // calculate current page number
    $(".pageNumber").each(function(i){
        $(this).prepend((i + 1));
    });
    
    // keyboard navigation between sections
    $(document.documentElement).keyup(function (event) {
        if (event.keyCode == 74) {
            $("nav a.next").click(); 
        } else if (event.keyCode == 75) {
            $("nav a.prev").click(); 
        }
    });
    
    // hyphenate
    	Hyphenator.config({
		displaytogglebox : true,
		classname: 'articleFlow',
		orphancontrol: 2,
		minwordlength : 4
	});
	Hyphenator.run();
   
    
    // and we're done
    
});

