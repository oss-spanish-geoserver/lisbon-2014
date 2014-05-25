

  var torqueLayer;

  function main() {
    
    var map = L.map('map', { 
      zoomControl: false,
      center: [38.722252, -9.139337],
      zoom: 3
    });

    cdb.vis.Overlay.register('match_slider', function(data, viz) {
      data.template = $('#match_slider').html(); 
      var slider = new MatchSlider(data);
      return slider.render();
    });

    // map zoom control
    cdb.vis.Overlay.register('match_zoom', function(data, vis) {
      data.template = $("#match_zoom").html();

      var zoom = new cdb.geo.ui.Zoom({
        model: data.map,
        template: cdb.core.Template.compile(data.template)
      });

      return zoom.render();
    });

    // add a nice baselayer from Stamen 
    L.tileLayer('https://cartocdn_{s}.global.ssl.fastly.net/base-dark/{z}/{x}/{y}.png').addTo(map);

    cartodb.createLayer(map, 'http://srogers.cartodb.com/api/v2/viz/a43ea07a-e3f2-11e3-92f9-0e230854a1cb/viz.json',{
      time_slider: false
    })
      .addTo(map)
      .done(function(layer) {

        var hash = new L.Hash(map, layer);

        var test = map.viz.addOverlay({
          type: 'match_zoom',
          layer: layer
        });

        var share = map.viz.addOverlay({
          type: 'share',
          layer: layer
        })

        slider = map.viz.addOverlay({
          type: 'match_slider',
          layer: layer
        });
        
        torqueLayer = layer;
        torqueLayer.stop();

        torqueLayer.on('load', function() {
          torqueLayer.play();

          drawStartEnd()
        });

        torqueLayer.on('change:time', checkTime);
      })
      .on('error', manageError);
  }

  function manageError(err, layer) {
    $('#not_supported_dialog').show();
    // hide all the overlays
    var overlays = this.getOverlays()
    for (var i = 0; i < overlays.length; ++i) {
      var o = overlays[i];
      o.hide && o.hide();
    }
  }

  function checkTime(data) {

    _.each(match_data.highlights, function(d,i) {
      
      // Block
      var block = d.team.indexOf('Atlético') !== -1 ? 'atletico' : 'madrid';

      if (new Date(data.time) >= new Date(i)) {
        
        if (!d.el) {

          var div = $('<div>').addClass('highlight ' + block);

          div.append($('<i>')
              .addClass("icon " + d.type + " ")
              .attr('data-tipsy', d.text)
              .append(d.type));
          
          div.append($('<span>').addClass('line'));

          d.el = div;

          var pos = getHighlightPos(new Date(i).getTime());

          // Position
          d.el.css({
            left: pos + "%"
          });

          $('.highlights').find('.' + block + ' .timeline').append(d.el);

          generateTooltip(d.el.find('i'));

          if (d.type === "goal") {
            var goals = parseInt($('em.' + block).text());
            $('em.' + block).text(++goals);
          }
        }

        d.el.show();
      } else {
        
        if (d.el && d.type === "goal") {
          var goals = parseInt($('em.' + block).text());
          $('em.' + block).text(--goals);
        }

        if (d.el) {
          d.el
            .hide()
            .remove();

          delete d.el;
        }
      }
      
    })
  }

  function generateTooltip($el) {
    
    // $el.tipsy({
    //   // trigger:  'manual',
    //   title:    function() {
    //     return this.getAttribute('data-tipsy') + ''
    //   },
    //   html:     true,
    //   gravity:  $.fn.tipsy.autoBounds(250, 's'),
    //   fade:     true,
    //   delayIn:  300,
    //   delayOut: 750
    // })

    // $('#mylink').attr('title','Input here:<input id="toolbar">');
    // $('#mylink').tipsy({trigger:'manual',gravity:'w', html:true});

    // //.tipsy class is what the generated tooltip divs have, so we use the 
    // //live event to link the mouseover/mouseout events
    // $('.tipsy').live('mouseover',function(e){
    //   clearTimeout(timer);
    // });
    // $('.tipsy').live('mouseout',function(e){
    //   timer = setTimeout("$('#mylink').tipsy('hide');",3000);//hide the link in 3 seconds
    // });

    // //manually show the tooltip
    // $('#mylink').bind('mouseover',function(e){
    //    $(this).tipsy('show');
    //  });
  }

  function getHighlightPos(timestamp)  {
    var tb = torqueLayer.getTimeBounds();
    return ((timestamp-tb.start)*100)/(tb.end-tb.start);
  }

  function drawStartEnd() {

    if ($('.icon.start').length > 0) {
      return false;
    }

    // Draw start
    var div = $('<div>').addClass('highlight');
    div.append($('<i>').addClass("icon start"));
    div.append($('<span>').addClass('separator'));
    div.append($('<p>').text(match_data.start.text));
    var pos = getHighlightPos(new Date(match_data.start.time).getTime());
    
    div.css({ left: pos + "%" });
    $('.highlights .timeslider').find('.wrap_slider')
      .append(div)
      .append(
        $('<span>')
          .addClass('slider_mamufas start')
          .css({
            left: 0,
            width: pos + '%'
          })
      );

    // Draw end
    var div = $('<div>').addClass('highlight');
    div.append($('<i>').addClass("icon end"));
    div.append($('<span>').addClass('separator'));
    div.append($('<p>').text(match_data.end.text));
    var pos = getHighlightPos(new Date(match_data.end.time).getTime());
    
    div.css({ left: pos + "%" });
    $('.highlights .timeslider').find('.wrap_slider')
      .append(div)
      .append(
        $('<span>')
          .addClass('slider_mamufas end')
          .css({
            right: 0,
            left: pos + "%"
          })
      );
  }

  window.onload = main;